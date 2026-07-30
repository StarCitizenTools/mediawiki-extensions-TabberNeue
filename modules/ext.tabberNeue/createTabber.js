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
 * so it is public API that wiki gadgets can filter on; keep the list here in
 * sync with anything that branches on it. `find` can arrive in bursts — see
 * domHelpers.isBurstSource().
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
		// Before anything measures or transcludes: a panel still carrying
		// `hidden="until-found"` has its contents skipped and measures zero height.
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
		// section's own box to reveal content it was clipping — an in-panel anchor
		// jump, or a reveal that predates init(). The section's resting state is
		// always scrollTop 0, so transfer that offset to the page scroll to keep
		// the revealed content exactly where it was put. The reset has to be
		// explicit: sizing the section does not reliably clamp the offset away.
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
		tablist, header, animationsEnabled, raf, enabled: !isWrap
	} );
	const debouncedUpdateOverflow = mwApi.util.debounce(
		() => units.overflow.update(), 100
	);

	units.keyboard = createKeyboardNavigator( {
		tablist, tabs,
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
				units.overflow.scrollBy( -tablist.offsetWidth / 2 );
			} else if ( e.target.closest( '.tabber__header__next' ) ) {
				units.overflow.scrollBy( tablist.offsetWidth / 2 );
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
		// Only correct for a jump that stays *inside* this panel. A link to an id
		// in a different panel is a tab change, which the hash router already
		// handles — correcting here too would size the section to the wrong panel
		// and pay the scroll transfer a second time, throwing the target well off
		// screen.
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
		// Read the browser's reveal before anything else touches layout.
		// Dropping `tabber--init` below releases the critical CSS's `height: 0`
		// on non-first panels; the next layout flush gives them their real height
		// and clamps any in-panel scroll offset to 0. Captured after the class
		// swap, revealedOffset is therefore always 0 and this whole branch is
		// dead — which is exactly how a deep match got left off-screen.
		// section.scrollLeft is unaffected by panel heights and survives either
		// way, so only the in-panel offset needs the early read.
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
		// The browser picked its page scroll against the pre-init layout, where
		// the critical CSS collapses every panel but the first to zero height.
		// Giving the panel its real height invalidates that choice.
		if ( revealedOffset ) {
			// It had scrolled inside the panel to reach the match, and that offset
			// clamps away once the panel is no longer zero-height. Transfer it to
			// the page scroll so the match keeps its position — this is the only
			// way to land on a match deeper than one viewport.
			revealedPanel.scrollTop = 0;
			win.scrollBy( { top: revealedOffset, behavior: 'instant' } );
		} else {
			// No in-panel offset to go on, so the best available is the panel
			// itself. Nothing exposes where a find-in-page hit actually landed.
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
	 * The tab whose panel the browser has already scrolled the section to, or
	 * null when the section is still resting on the default panel.
	 *
	 * Something outside this module can move the section before init() runs: a
	 * `#:~:text=` fragment directive, or a find-in-page match the browser
	 * revealed while ext.tabberNeue was still loading. init() would otherwise
	 * scroll straight back to the default panel and throw that reveal away.
	 *
	 * Meaningful only before init(). Afterwards the section rests on the active
	 * panel by construction, so this just returns the active tab.
	 *
	 * @return {HTMLElement|null}
	 */
	function getRevealedPanel() {
		// The browser reveals along whichever axis it can, and the two cases are
		// not interchangeable.
		//
		// It scrolled the section sideways onto the panel.
		if ( section.scrollLeft ) {
			const panel = panelAtScrollOffset( section, panels );
			if ( panel ) {
				return panel;
			}
		}
		// It scrolled *within* a panel instead, leaving the section at 0. Before
		// init() the critical CSS collapses every panel but the first to zero
		// height, so a match deep inside one is revealed by scrolling that
		// panel's own box. This is the only signal Firefox produces, and the only
		// one available when the match sits deeper than the viewport.
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
