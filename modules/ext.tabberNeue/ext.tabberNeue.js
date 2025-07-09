const config = require( './config.json' );
const Transclude = require( './Transclude.js' );
const Util = require( './Util.js' );

const tabberInstances = new WeakMap();

/**
 * Handles resize events for all tabber instances.
 *
 * @param {ResizeObserverEntry[]} entries
 */
function onResize( entries ) {
	for ( const { target } of entries ) {
		const tabberEl = target.closest( '.tabber' );
		if ( tabberEl && tabberInstances.has( tabberEl ) ) {
			tabberInstances.get( tabberEl ).handleResize( target );
		}
	}
}

// A single ResizeObserver for all tabbers for performance.
// eslint-disable-next-line compat/compat
const resizeObserver = new ResizeObserver( onResize );

class Tabber {
	/**
	 * @param {Element} tabberEl The tabber DOM element.
	 */
	constructor( tabberEl ) {
		this.element = tabberEl;

		const header = this.element.querySelector( ':scope > .tabber__header' );
		const tablist = header.querySelector( ':scope > .tabber__tabs' );
		const tabs = tablist.querySelectorAll( ':scope > .tabber__tab' );
		const section = this.element.querySelector( ':scope > .tabber__section' );
		const panels = section.querySelectorAll( ':scope > .tabber__panel' );
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

		this.header = header;
		this.tablist = tablist;
		this.tabs = tabs;
		this.section = section;
		this.panels = panels;
		this.panelToTabMap = panelToTabMap;
		this.panelIdToPanelMap = panelIdToPanelMap;

		this.activeTab = null;
		this.activeTabpanel = null;
		this.tabFocus = 0;

		this.panelObserver = null;
		this.visibilityObserver = null;

		this.debouncedUpdateHeaderOverflow = mw.util.debounce(
			() => this.updateHeaderOverflow(),
			100
		);

		// Bind event handlers to this instance
		this.onHeaderClick = this.onHeaderClick.bind( this );
		this.onSectionClick = this.onSectionClick.bind( this );
		this.onTablistScroll = this.onTablistScroll.bind( this );
		this.onTablistKeydown = this.onTablistKeydown.bind( this );
		this.handlePanelIntersection = this.handlePanelIntersection.bind( this );
	}

	/**
	 * Determines if animations should be shown based on user preference and config.
	 *
	 * @return {boolean}
	 */
	static shouldShowAnimation() {
		return (
			!window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches &&
			config.enableAnimation
		);
	}

	/**
	 * Toggles the global animation-ready class on the document element.
	 *
	 * @param {boolean} enable
	 */
	static toggleAnimation( enable ) {
		if ( !Tabber.shouldShowAnimation() ) {
			return;
		}
		document.documentElement.classList.toggle(
			'tabber-animations-ready',
			enable
		);
	}

	/**
	 * Initializes the tabber instance.
	 *
	 * @param {string} urlHash - The current URL hash.
	 */
	async init( urlHash ) {
		this.setTabsAttributes();

		const activeTab = this.getActiveTab( urlHash );
		await this.setActiveTab( activeTab );

		this.updateHeaderOverflow();

		this.initVisibilityObserver();
		this.initPanelIntersectionObserver();

		this.element.classList.remove( 'tabber--init' );
		this.element.classList.add( 'tabber--live' );
	}

	/**
	 * Sets initial attributes on all tabs.
	 *
	 * @private
	 */
	setTabsAttributes() {
		const tabAttributes = {
			tabindex: '-1',
			'aria-selected': 'false'
		};
		for ( const tab of this.tabs ) {
			Util.setAttributes( tab, tabAttributes );
		}
	}

	/**
	 * Gets the tab that should be active on initialization
	 *
	 * @param {string} urlHash - The URL hash.
	 * @return {Element} The tab element to activate.
	 * @private
	 */
	getActiveTab( urlHash ) {
		const defaultTab = this.tablist.firstElementChild;
		if ( !urlHash ) {
			return defaultTab;
		}

		// Case 1: Hash directly targets a panel ID.
		const tabForPanel = this.tablist.querySelector(
			`.tabber__tab[aria-controls="${ CSS.escape( urlHash ) }"]`
		);
		if ( tabForPanel ) {
			return tabForPanel;
		}

		// Case 2: Hash targets an element inside a panel.
		const targetEl = document.getElementById( urlHash );
		if ( targetEl ) {
			const panel = targetEl.closest( '.tabber__panel' );
			if ( panel && panel.closest( '.tabber' ) === this.element ) {
				return this.panelToTabMap.get( panel ) || defaultTab;
			}
		}

		return defaultTab;
	}

	/**
	 * Sets the active tab and panel.
	 *
	 * @param {Element} activeTab - The tab to activate.
	 * @param {Object} [options] - Options for setting the tab.
	 * @param {boolean} [options.preventScroll=false] - Prevent horizontal scrolling of the panel.
	 * @private
	 */
	async setActiveTab( activeTab, options = {} ) {
		if ( !activeTab || this.activeTab === activeTab ) {
			return;
		}

		if ( this.activeTab ) {
			this.activeTab.setAttribute( 'tabindex', '-1' );
			this.activeTab.setAttribute( 'aria-selected', 'false' );
		}

		activeTab.setAttribute( 'tabindex', '0' );
		activeTab.setAttribute( 'aria-selected', 'true' );
		this.activeTab = activeTab;

		// Unobserve previous panel and observe new one
		if ( this.activeTabpanel ) {
			resizeObserver.unobserve( this.activeTabpanel );
		}
		const panelId = this.activeTab.getAttribute( 'aria-controls' );
		this.activeTabpanel = this.panelIdToPanelMap.get( panelId );

		if ( !this.activeTabpanel ) {
			return;
		}
		resizeObserver.observe( this.activeTabpanel );

		this.setActiveTabpanel( this.activeTabpanel, options );
	}

	/**
	 * Sets the active tab panel, adjusts section height, and handles transclusion.
	 *
	 * @param {Element} activeTabpanel - The panel to activate.
	 * @param {Object} [options] - Options.
	 * @param {boolean} [options.preventScroll=false] - Prevent scrolling.
	 * @private
	 */
	setActiveTabpanel( activeTabpanel, options = {} ) {
		if ( !activeTabpanel ) {
			return;
		}
		if ( activeTabpanel.querySelector( '.tabber__transclusion' ) ) {
			const transclude = new Transclude( activeTabpanel, config.cdnMaxAge );
			transclude.loadPage();
		}

		const activeTabpanelHeight = Util.getElementSize(
			activeTabpanel,
			'height'
		);
		this.section.style.height = activeTabpanelHeight + 'px';

		if ( !options.preventScroll ) {
			window.requestAnimationFrame( () => {
				this.section.scrollLeft = activeTabpanel.offsetLeft;
			} );
		}
	}

	/**
	 * Updates the visibility of previous/next arrow buttons on the tab list.
	 *
	 * @private
	 */
	updateHeaderOverflow() {
		const tablistWidth = this.tablist.offsetWidth;
		const tablistScrollWidth = this.tablist.scrollWidth;
		const isScrollable = tablistScrollWidth > tablistWidth;

		if ( !isScrollable ) {
			this.header.classList.remove(
				'tabber__header--next-visible',
				'tabber__header--prev-visible'
			);
			return;
		}

		const scrollLeft = Util.roundScrollLeft( this.tablist.scrollLeft );
		const isAtStart = scrollLeft <= 0;
		const isAtEnd = scrollLeft + tablistWidth >= tablistScrollWidth;
		const isAtMiddle = !isAtStart && !isAtEnd;

		this.header.classList.toggle(
			'tabber__header--next-visible',
			isAtStart || isAtMiddle
		);
		this.header.classList.toggle(
			'tabber__header--prev-visible',
			isAtEnd || isAtMiddle
		);
	}

	/**
	 * Handles clicks on the header area (tabs, prev/next buttons).
	 *
	 * @param {MouseEvent} e
	 */
	onHeaderClick( e ) {
		const tab = e.target.closest( '.tabber__tab' );
		if ( tab ) {
			e.preventDefault();
			this.setActiveTab( tab );

			if ( config.updateLocationOnTabChange ) {
				history.replaceState(
					null,
					'',
					`${ window.location.pathname }${ window.location.search }#${ tab.getAttribute( 'aria-controls' ) }`
				);
			}
			return;
		}

		const isPointerDevice = window.matchMedia( '(hover: hover)' ).matches;
		if ( isPointerDevice ) {
			if ( e.target.closest( '.tabber__header__prev' ) ) {
				this.scrollTablist( -this.tablist.offsetWidth / 2 );
			} else if ( e.target.closest( '.tabber__header__next' ) ) {
				this.scrollTablist( this.tablist.offsetWidth / 2 );
			}
		}
	}

	/**
	 * Handles clicks inside the tabber section, especially for in-page anchors.
	 *
	 * @param {MouseEvent} e
	 */
	onSectionClick( e ) {
		const anchor = e.target.closest( 'a[href^="#"]' );
		const tabpanel = anchor ? anchor.closest( '.tabber__panel' ) : null;
		if ( !anchor || !tabpanel ) {
			return;
		}

		// Fix for #240: browser scrolling the entire section vertically.
		// Resetting the height after a delay seems to correct it.
		if ( document.getElementById( anchor.hash.slice( 1 ) ) ) {
			setTimeout( () => {
				this.setActiveTabpanel( tabpanel );
			}, 0 );
		}
	}

	/**
	 * Handles horizontal scrolling of the tab list.
	 */
	onTablistScroll() {
		this.debouncedUpdateHeaderOverflow();
	}

	/**
	 * Handles keyboard navigation for tabs.
	 *
	 * @param {KeyboardEvent} e
	 */
	onTablistKeydown( e ) {
		const keyMap = {
			Home: 'home',
			End: 'end',
			ArrowRight: 'right',
			ArrowLeft: 'left'
		};

		if ( keyMap[ e.key ] ) {
			e.preventDefault();
			this.handleTabFocusChange( keyMap[ e.key ] );
		}
	}

	/**
	 * Manages focus between tabs during keyboard navigation.
	 *
	 * @param {string} direction - 'home', 'end', 'right', or 'left'.
	 * @private
	 */
	handleTabFocusChange( direction ) {
		this.tabs[ this.tabFocus ].setAttribute( 'tabindex', '-1' );
		const tabCount = this.tabs.length;

		switch ( direction ) {
			case 'home':
				this.tabFocus = 0;
				break;
			case 'end':
				this.tabFocus = tabCount - 1;
				break;
			case 'right':
				this.tabFocus = ( this.tabFocus + 1 ) % tabCount;
				break;
			case 'left':
				this.tabFocus = ( this.tabFocus - 1 + tabCount ) % tabCount;
				break;
		}

		this.tabs[ this.tabFocus ].setAttribute( 'tabindex', '0' );
		this.tabs[ this.tabFocus ].focus();
	}

	/**
	 * Smoothly scrolls the tab list horizontally.
	 *
	 * @param {number} offset - The amount to scroll by.
	 * @private
	 */
	scrollTablist( offset ) {
		const currentScroll = Util.roundScrollLeft( this.tablist.scrollLeft );
		const maxScroll = this.tablist.scrollWidth - this.tablist.offsetWidth;
		const targetScroll = Math.min( Math.max( currentScroll + offset, 0 ), maxScroll );

		window.requestAnimationFrame( () => {
			this.tablist.scrollLeft = targetScroll;
		} );
	}

	/**
	 * Handles resize events for elements within this tabber instance.
	 *
	 * @param {Element} target - The element that was resized.
	 * @private
	 */
	handleResize( target ) {
		if ( target.classList.contains( 'tabber__tabs' ) ) {
			this.updateHeaderOverflow();
		} else if ( target.classList.contains( 'tabber__panel' ) ) {
			// If an active panel resizes (e.g., image loaded), adjust container height.
			if ( target === this.activeTabpanel ) {
				this.setActiveTabpanel( target, { preventScroll: true } );
			}
		}
	}

	/**
	 * Attaches event listeners for an active tabber.
	 *
	 * @private
	 */
	addEventListeners() {
		this.header.addEventListener( 'click', this.onHeaderClick );
		this.section.addEventListener( 'click', this.onSectionClick );
		this.tablist.addEventListener( 'scroll', this.onTablistScroll );
		this.tablist.addEventListener( 'keydown', this.onTablistKeydown );

		resizeObserver.observe( this.tablist );
		if ( this.activeTabpanel ) {
			resizeObserver.observe( this.activeTabpanel );
		}
		if ( this.panelObserver ) {
			for ( const panel of this.panels ) {
				this.panelObserver.observe( panel );
			}
		}
	}

	/**
	 * Removes event listeners for a paused tabber.
	 *
	 * @private
	 */
	removeEventListeners() {
		this.header.removeEventListener( 'click', this.onHeaderClick );
		this.section.removeEventListener( 'click', this.onSectionClick );
		this.tablist.removeEventListener( 'scroll', this.onTablistScroll );
		this.tablist.removeEventListener( 'keydown', this.onTablistKeydown );

		resizeObserver.unobserve( this.tablist );
		if ( this.activeTabpanel ) {
			resizeObserver.unobserve( this.activeTabpanel );
		}
		if ( this.panelObserver ) {
			this.panelObserver.disconnect();
		}
	}

	/**
	 * Creates the observer that pauses the tabber when it's not visible.
	 *
	 * @private
	 */
	initVisibilityObserver() {
		// eslint-disable-next-line compat/compat
		this.visibilityObserver = new IntersectionObserver( ( entries ) => {
			entries.forEach( ( entry ) => {
				if ( entry.isIntersecting ) {
					this.addEventListeners();
				} else {
					this.removeEventListeners();
				}
			} );
		} );
		this.visibilityObserver.observe( this.element );
	}

	/**
	 * Creates the observer that updates the active tab when scrolling through panels.
	 *
	 * @private
	 */
	initPanelIntersectionObserver() {
		const observerOptions = {
			root: this.section,
			threshold: 0.5
		};

		// eslint-disable-next-line compat/compat
		this.panelObserver = new IntersectionObserver(
			this.handlePanelIntersection,
			observerOptions
		);
	}

	/**
	 * Callback for the panel intersection observer.
	 *
	 * @param {IntersectionObserverEntry[]} entries
	 * @private
	 */
	handlePanelIntersection( entries ) {
		for ( const entry of entries ) {
			if ( entry.isIntersecting ) {
				const panel = entry.target;
				const tab = this.panelToTabMap.get( panel );
				if ( tab && tab !== this.activeTab ) {
					this.setActiveTab( tab, { preventScroll: true } );
				}
			}
		}
	}
}

/**
 * Initializes all tabbers on the page.
 *
 * @return {Promise<void>}
 */
async function load() {
	const tabberEls = document.querySelectorAll( '.tabber--init' );
	if ( tabberEls.length === 0 ) {
		return;
	}

	const urlHash = window.location.hash.slice( 1 );
	mw.loader.load( 'ext.tabberNeue.icons' );

	await Promise.all( [ ...tabberEls ].map( async ( tabberEl ) => {
		const tabber = new Tabber( tabberEl );
		tabberInstances.set( tabberEl, tabber );
		await tabber.init( urlHash );
	} ) );

	setTimeout( () => {
		// Delay animations to prevent flashes on page load.
		Tabber.toggleAnimation( true );
	}, 250 );
}

/**
 * Handles URL hash changes to activate the correct tab.
 */
function handleHashChange() {
	const hash = window.location.hash.slice( 1 );
	if ( !hash ) {
		return;
	}

	const targetEl = document.getElementById( hash );
	const panel = targetEl ? targetEl.closest( '.tabber__panel' ) : null;

	let tabToActivate;

	if ( panel ) {
		// Case 1: The hash points to an element inside a panel.
		const tabberEl = panel.closest( '.tabber--live' );
		if ( tabberEl && tabberInstances.has( tabberEl ) ) {
			const instance = tabberInstances.get( tabberEl );
			tabToActivate = instance.panelToTabMap.get( panel );
		}
	} else {
		// Case 2: The hash is the ID of a tab panel itself.
		const tabberEl = document.querySelector( '.tabber--live' );
		if ( tabberEl && tabberInstances.has( tabberEl ) ) {
			const instance = tabberInstances.get( tabberEl );
			tabToActivate = instance.tablist.querySelector(
				`:scope > .tabber__tab[aria-controls="${ CSS.escape( hash ) }"]`
			);
		}
	}

	if ( tabToActivate && tabToActivate.getAttribute( 'aria-selected' ) !== 'true' ) {
		const tabberEl = tabToActivate.closest( '.tabber--live' );
		if ( tabberEl && tabberInstances.has( tabberEl ) ) {
			const instance = tabberInstances.get( tabberEl );
			instance.setActiveTab( tabToActivate );
		}
	}
}

/**
 * Main entry point.
 */
function main() {
	load();
	window.addEventListener( 'hashchange', handleHashChange );
}

mw.hook( 'wikipage.content' ).add( () => {
	main();
} );

mw.loader.using( 'ext.visualEditor.desktopArticleTarget.init' ).then( () => {
	mw.hook( 'postEdit.afterRemoval' ).add( () => {
		main();
	} );
} );
