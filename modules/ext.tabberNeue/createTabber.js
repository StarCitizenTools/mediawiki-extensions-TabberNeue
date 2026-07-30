const createOverflowController = require( './createOverflowController.js' );
const createKeyboardNavigator = require( './createKeyboardNavigator.js' );
const createFindReveal = require( './createFindReveal.js' );
const createVisibilityObserver = require( './createVisibilityObserver.js' );
const createPanelTransition = require( './createPanelTransition.js' );
const createTabIndicator = require( './createTabIndicator.js' );
const createViewTransitionWrapper = require( './createViewTransitionWrapper.js' );
const defaultLoadTransclusion = require( './loadTransclusion.js' );
const { getElementSize, panelAtScrollOffset, setAttributes } = require( './domHelpers.js' );

/**
 * Per-element orchestrator. Composes the unit factories and owns the
 * active-tab/active-panel state. Dispatches `tabber:tabchange`.
 *
 * What caused an activation. Travels on `tabber:tabchange` as `detail.source`,
 * so it is public API wiki gadgets can filter on. `find` can arrive in bursts —
 * see domHelpers.isBurstSource().
 *
 * @typedef {'init'|'user-click'|'user-keyboard'|'hash'|'find'|
 *   'programmatic'} ActivationSource
 *
 * @typedef {Object} CreateTabberOpts
 * @property {HTMLElement} element
 * @property {Object} registry — exposes observeResize, unobserveResize, get
 * @property {Object} deps
 * @property {Object} deps.config
 * @property {Object} deps.mw
 * @property {Window} [deps.window]
 * @property {Document} [deps.document]
 * @property {Function} [deps.IntersectionObserver]
 * @property {Function} [deps.requestAnimationFrame]
 * @property {Function} [deps.setTimeout]
 * @property {Function} [deps.loadTransclusion]
 */

/**
 * @param {CreateTabberOpts} opts
 * @return {Object}
 */
function createTabber( opts ) {
	const element = opts.element;
	const registry = opts.registry;
	const deps = opts.deps || {};
	const config = deps.config;
	const mwApi = deps.mw;
	const win = deps.window || window;
	const doc = deps.document || document;
	const IO = deps.IntersectionObserver || window.IntersectionObserver;
	const raf = deps.requestAnimationFrame ||
		window.requestAnimationFrame.bind( window );
	const setTimeoutFn = deps.setTimeout || window.setTimeout.bind( window );
	const transclude = deps.loadTransclusion || defaultLoadTransclusion;

	const animationsEnabled =
		!win.matchMedia( '(prefers-reduced-motion: reduce)' ).matches &&
		config.enableAnimation;
	const isPointerDevice = win.matchMedia( '(hover: hover)' ).matches;

	// Query DOM
	const header = element.querySelector( ':scope > .tabber__header' );
	const tablist = header.querySelector( ':scope > .tabber__tabs' );
	const tabs = tablist.querySelectorAll( ':scope > .tabber__tab' );
	const section = element.querySelector( ':scope > .tabber__section' );
	const panels = section.querySelectorAll( ':scope > .tabber__panel' );

	const tablistStyle = win.getComputedStyle( tablist );
	const rtl = tablistStyle.direction === 'rtl';
	const arrowWidth =
		parseFloat( tablistStyle.getPropertyValue( '--tabber-arrow-width' ) ) || 0;

	// Build maps
	const panelToTabMap = new WeakMap();
	const panelIdToPanelMap = new Map();
	for ( const panel of panels ) {
		const tab = tablist.querySelector(
			`:scope > .tabber__tab[aria-controls="${ CSS.escape( panel.id ) }"]`
		);
		if ( tab ) {
			panelToTabMap.set( panel, tab );
		}
		panelIdToPanelMap.set( panel.id, panel );
	}

	// Initialize tab attrs
	for ( const tab of tabs ) {
		setAttributes( tab, { tabindex: '-1', 'aria-selected': 'false' } );
	}

	let activeTab = null;
	let activePanel = null;

	// units is a mutable container so overflow and findReveal can be assigned
	// after construction while remaining referenceable from activate/setActivePanel,
	// which are declared as hoisted function declarations and are only *called*
	// after the units are assigned.
	const units = {};
	const isWrap = element.classList.contains( 'tabber--wrap' );
	units.tabIndicator = createTabIndicator( { tablist, document: doc, enabled: !isWrap } );
	units.panelTransition = createPanelTransition( { document: doc } );
	units.vt = createViewTransitionWrapper( { section, document: doc } );
	units.findReveal = createFindReveal( {
		section, panels, document: doc,
		onReveal: ( panel ) => {
			const tab = panelToTabMap.get( panel );
			if ( tab ) {
				activate( tab, { source: 'find' } );
			}
		}
	} );

	function setActivePanel( panel, options = {} ) {
		if ( !panel ) {
			return;
		}
		// Reveal before measuring: a panel still carrying `hidden="until-found"`
		// skips its contents and measures zero height.
		units.findReveal.sync( panel );
		if ( panel.querySelector( '.tabber__transclusion' ) ) {
			transclude( {
				panel,
				api: new mwApi.Api(),
				log: mwApi.log,
				cdnMaxAge: config.cdnMaxAge,
				messageBox: mwApi.util.messageBox,
				escape: mwApi.html.escape,
				// eslint-disable-next-line no-jquery/no-jquery-constructor, no-undef
				onContentReplaced: ( p ) => mwApi.hook( 'wikipage.content' ).fire( $( p ) )
			} );
		}
		// A non-zero scrollTop means something outside this module scrolled the
		// section's own box to reveal clipped content — an in-panel anchor jump,
		// or a pre-init reveal. The section rests at scrollTop 0, so move that
		// offset to the page scroll to hold the content in place. Reset it
		// explicitly; resizing the section does not reliably clamp it away.
		const clippedScrollTop = section.scrollTop;
		const h = getElementSize( panel, 'height' );
		section.style.height = h + 'px';
		if ( clippedScrollTop ) {
			section.scrollTop = 0;
			win.scrollBy( { top: clippedScrollTop, behavior: 'instant' } );
		}
		if ( !options.preventScroll ) {
			section.scrollLeft = panel.offsetLeft;
		}
	}

	function performActivation( tab, options ) {
		if ( activeTab ) {
			activeTab.setAttribute( 'tabindex', '-1' );
			activeTab.setAttribute( 'aria-selected', 'false' );
		}
		tab.setAttribute( 'tabindex', '0' );
		tab.setAttribute( 'aria-selected', 'true' );
		activeTab = tab;
		units.tabIndicator.update( activeTab );

		units.overflow.scrollTabIntoView( tab );

		const panelId = tab.getAttribute( 'aria-controls' );
		const newActivePanel = panelIdToPanelMap.get( panelId );
		const previousActivePanel = activePanel;

		if ( previousActivePanel && previousActivePanel !== newActivePanel ) {
			registry.unobserveResize( previousActivePanel );
		}
		activePanel = newActivePanel;

		// eslint-disable-next-line n/no-unsupported-features/node-builtins
		element.dispatchEvent( new CustomEvent( 'tabber:tabchange', {
			bubbles: true, composed: true,
			detail: { panelId, source: options.source || 'programmatic' }
		} ) );

		if ( !activePanel ) {
			return;
		}
		registry.observeResize( activePanel );
		setActivePanel( activePanel, options );
	}

	function activate( tab, options = {} ) {
		if ( !tab || activeTab === tab ) {
			return;
		}

		const previousActivePanel = activePanel;
		const newPanel = panelIdToPanelMap.get( tab.getAttribute( 'aria-controls' ) );

		if ( units.vt.canUse( options.source, !!previousActivePanel ) ) {
			const direction = newPanel.offsetLeft > previousActivePanel.offsetLeft ?
				'forward' :
				'backward';
			units.vt.wrap( () => performActivation( tab, options ), direction );
			return;
		}

		performActivation( tab, options );
		units.panelTransition.trigger( newPanel, previousActivePanel, options.source );
	}

	// Compose units
	units.overflow = createOverflowController( {
		tablist, header, animationsEnabled, raf, enabled: !isWrap, rtl, arrowWidth
	} );
	const debouncedUpdateOverflow = mwApi.util.debounce(
		() => units.overflow.update(), 100
	);

	units.keyboard = createKeyboardNavigator( {
		tablist, tabs, rtl,
		onActivate: ( tab ) => activate( tab, { source: 'user-keyboard' } )
	} );

	// Listeners
	function onHeaderClick( e ) {
		const tab = e.target.closest( '.tabber__tab' );
		if ( tab ) {
			e.preventDefault();
			activate( tab, { source: 'user-click' } );
			return;
		}
		if ( isPointerDevice ) {
			if ( e.target.closest( '.tabber__header__prev' ) ) {
				units.overflow.scrollBy( -tablist.clientWidth / 2 );
			} else if ( e.target.closest( '.tabber__header__next' ) ) {
				units.overflow.scrollBy( tablist.clientWidth / 2 );
			}
		}
	}

	// In-panel anchor clicks scroll within a panel (e.g. a heading link inside
	// a tab's content). They are NOT tab activations: the tab itself is not
	// changing. We deliberately bypass activate() — no ARIA updates, no
	// tabber:tabchange dispatch, no overflow scroll-into-view. We only correct
	// the section's vertical scroll position, which the anchor-jump otherwise
	// disrupts. This matches the original Tabber.onSectionClick behavior.
	function onSectionClick( e ) {
		const anchor = e.target.closest( 'a[href^="#"]' );
		const panel = anchor ? anchor.closest( '.tabber__panel' ) : null;
		if ( !anchor || !panel ) {
			return;
		}
		// Ignore clicks from nested tabbers (#252)
		if ( anchor.closest( '.tabber__section' ) !== section ) {
			return;
		}
		// Only for a jump that stays inside this panel. A link to another panel is
		// a tab change the hash router handles; correcting here as well would size
		// the section to the wrong panel and transfer the scroll offset twice.
		const target = doc.getElementById( anchor.hash.slice( 1 ) );
		if ( target && panel.contains( target ) ) {
			setTimeoutFn( () => {
				setActivePanel( panel );
			}, 0 );
		}
	}

	function onTablistScroll() {
		debouncedUpdateOverflow();
	}

	function attachListeners() {
		header.addEventListener( 'click', onHeaderClick );
		section.addEventListener( 'click', onSectionClick );
		tablist.addEventListener( 'scroll', onTablistScroll );
	}

	function detachListeners() {
		header.removeEventListener( 'click', onHeaderClick );
		section.removeEventListener( 'click', onSectionClick );
		tablist.removeEventListener( 'scroll', onTablistScroll );
	}

	const visibility = createVisibilityObserver( {
		element,
		IntersectionObserver: IO,
		onShow: () => {
			attachListeners();
			registry.observeResize( tablist );
			if ( activePanel ) {
				registry.observeResize( activePanel );
			}
		},
		onHide: () => {
			detachListeners();
			registry.unobserveResize( tablist );
			if ( activePanel ) {
				registry.unobserveResize( activePanel );
			}
		}
	} );

	function init( initialTab ) {
		// Read any pre-init reveal before the class swap below drops the critical
		// CSS `height: 0` on non-first panels: giving them their real height
		// clamps an in-panel scroll offset back to 0. section.scrollLeft is
		// unaffected by height, so only the in-panel offset needs the early read.
		const revealedPanel = getRevealedPanel();
		const revealedTab = revealedPanel ? panelToTabMap.get( revealedPanel ) : null;
		const revealedOffset = revealedPanel ? revealedPanel.scrollTop : 0;

		units.overflow.update();
		// Mark live before the first activate() so any listener that filters
		// on the tabber--live class sees the bootstrap event in the correct
		// state. Current consumers don't filter, but this is cheap insurance.
		element.classList.remove( 'tabber--init' );
		element.classList.add( 'tabber--live' );
		activate( initialTab, { source: 'init' } );
		if ( !revealedTab || revealedTab !== initialTab || !activePanel ) {
			return;
		}
		// The browser chose its page scroll against the pre-init layout. Now that
		// the panel has its real height, put the reveal back in view.
		if ( revealedOffset ) {
			// The match was reached by scrolling inside the panel; that offset has
			// just been clamped away, so hand it to the page scroll instead. This
			// is the only path that reaches a match deeper than one viewport.
			revealedPanel.scrollTop = 0;
			win.scrollBy( { top: revealedOffset, behavior: 'instant' } );
		} else {
			// No in-panel offset to transfer, so re-show the panel itself. The
			// exact match position within it is not exposed to script.
			activePanel.scrollIntoView( { block: 'nearest' } );
		}
	}

	function handleResize( target ) {
		if ( target === tablist ) {
			units.overflow.update();
			units.tabIndicator.update( activeTab );
		} else if ( target === activePanel ) {
			setActivePanel( target, { preventScroll: true } );
		}
	}

	function getDefaultTab() {
		return tablist.firstElementChild;
	}

	/**
	 * The panel the browser has already scrolled to before init() runs — via a
	 * `#:~:text=` directive or a find-in-page match landing during load — or null
	 * if the section is still at rest. init() adopts it so it does not scroll
	 * back to the default panel and discard the reveal.
	 *
	 * Only meaningful before init(); afterwards the section rests on the active
	 * panel, so it just returns that.
	 *
	 * @return {HTMLElement|null}
	 */
	function getRevealedPanel() {
		// The browser reveals along whichever axis it can. A sideways section
		// scroll lands on a panel directly.
		if ( section.scrollLeft ) {
			const panel = panelAtScrollOffset( section, panels );
			if ( panel ) {
				return panel;
			}
		}
		// Otherwise it scrolled within a panel, leaving the section at 0 — the
		// signal Firefox gives, and the only one for a match below the viewport.
		for ( const panel of panels ) {
			if ( panel.scrollTop ) {
				return panel;
			}
		}
		return null;
	}

	function getRevealedTab() {
		const panel = getRevealedPanel();
		if ( !panel ) {
			return null;
		}
		return panelToTabMap.get( panel ) || null;
	}

	function getTabForPanel( panel ) {
		return panelToTabMap.get( panel );
	}

	function hasPanel( panel ) {
		return panelToTabMap.has( panel );
	}

	return {
		init,
		activate,
		getActiveTab: () => activeTab,
		getActivePanel: () => activePanel,
		getDefaultTab,
		getRevealedTab,
		getTabForPanel,
		hasPanel,
		handleResize,
		destroy() {
			visibility.destroy();
			units.findReveal.destroy();
			units.overflow.destroy();
			units.keyboard.destroy();
			units.tabIndicator.destroy();
			detachListeners();
			registry.unobserveResize( tablist );
			if ( activePanel ) {
				registry.unobserveResize( activePanel );
			}
			registry.unregister( element );
		}
	};
}

module.exports = createTabber;
