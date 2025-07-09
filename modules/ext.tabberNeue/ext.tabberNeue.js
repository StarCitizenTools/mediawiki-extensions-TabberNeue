const config = require( './config.json' );
const Transclude = require( './Transclude.js' );
const Util = require( './Util.js' );

const IS_POINTER_DEVICE = window.matchMedia( '(hover: hover)' ).matches;
const OVERFLOW_BUTTON_WIDTH = 0.2;

class Tabber {
	/**
	 * @param {Element} tabberEl The tabber DOM element.
	 * @param {ResizeObserver} resizeObserver - A shared ResizeObserver instance.
	 */
	constructor( tabberEl, resizeObserver ) {
		this.element = tabberEl;
		this.resizeObserver = resizeObserver;

		this.queryElements();
		this.createPanelMaps();

		this.activeTab = null;
		this.activeTabpanel = null;
		this.tabFocus = 0;
		this.isOverflowing = false;
		this.isProgrammaticPanelScroll = false;
		this.scrollTimeout = null;

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
		this.onSectionScroll = this.onSectionScroll.bind( this );
	}

	/**
	 * Queries and stores references to DOM elements.
	 */
	queryElements() {
		const header = this.element.querySelector( ':scope > .tabber__header' );
		const tablist = header.querySelector( ':scope > .tabber__tabs' );
		const tabs = tablist.querySelectorAll( ':scope > .tabber__tab' );
		const section = this.element.querySelector( ':scope > .tabber__section' );
		const panels = section.querySelectorAll( ':scope > .tabber__panel' );

		this.header = header;
		this.tablist = tablist;
		this.tabs = tabs;
		this.section = section;
		this.panels = panels;
	}

	/**
	 * Creates maps for quick lookups between panels and tabs.
	 */
	createPanelMaps() {
		const panelToTabMap = new WeakMap();
		const panelIdToPanelMap = new Map();

		for ( const panel of this.panels ) {
			const tab = this.tablist.querySelector(
				`:scope > .tabber__tab[aria-controls="${ CSS.escape( panel.id ) }"]`
			);
			if ( tab ) {
				panelToTabMap.set( panel, tab );
			}
			panelIdToPanelMap.set( panel.id, panel );
		}

		this.panelToTabMap = panelToTabMap;
		this.panelIdToPanelMap = panelIdToPanelMap;
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
	 * Finds a panel element from a URL hash.
	 *
	 * @param {string} hash - The URL hash (without the #).
	 * @return {Element|null} The panel element or null if not found.
	 * @private
	 */
	static getPanelFromHash( hash ) {
		if ( !hash ) {
			return null;
		}

		// percentDecodeFragment is needded for #209
		const targetElement = document.getElementById(
			mw.util.percentDecodeFragment( hash )
		);
		if ( targetElement === null ) {
			return null;
		}

		return targetElement.closest( '.tabber__panel' );
	}

	/**
	 * Initializes the tabber instance.
	 *
	 * @param {string} urlHash - The current URL hash.
	 */
	async init( urlHash ) {
		this.setTabsAttributes();

		const activeTab = this.getActiveTab( urlHash );

		// Determine initial overflow state before setting the active tab,
		// so it can be scrolled into view if needed.
		this.updateHeaderOverflow();
		await this.setActiveTab( activeTab );

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
		const panel = Tabber.getPanelFromHash( urlHash );

		// Verify this panel belongs to *this* tabber instance.
		if ( panel !== null && this.panelToTabMap.has( panel ) ) {
			return this.panelToTabMap.get( panel );
		}

		return defaultTab;
	}

	/**
	 * Sets the active tab and panel.
	 *
	 * @param {Element} activeTab - The tab to activate.
	 * @param {Object} [options] - Options for setting the tab.
	 * @param {boolean} [options.preventScroll=false] - Prevent horizontal scrolling of the panel.
	 * @param {string} [options.source='programmatic'] - The source of the tab change.
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

		if ( this.isOverflowing ) {
			const metrics = this.getLayoutMetrics( activeTab );
			const newScrollLeft = this.calculateNewScrollLeft( metrics );

			// Only scroll if a new position has been calculated and it's different.
			if ( newScrollLeft !== null && newScrollLeft !== metrics.scrollLeft ) {
				if ( Tabber.shouldShowAnimation() ) {
					// For smooth scroll, the onTablistScroll handler will update the header.
					this.tablist.scrollTo( { left: newScrollLeft, behavior: 'smooth' } );
				} else {
					// For instant scroll, batch the DOM writes.
					this.tablist.scrollLeft = newScrollLeft;
					this.updateHeaderOverflow();
				}
			}
		}

		/* eslint-disable-next-line n/no-unsupported-features/node-builtins */
		this.element.dispatchEvent( new CustomEvent( 'tabber:tabchange', {
			bubbles: true,
			composed: true,
			detail: {
				panelId: activeTab.getAttribute( 'aria-controls' ),
				source: options.source || 'programmatic'
			}
		} ) );

		// Unobserve previous panel and observe new one
		if ( this.activeTabpanel ) {
			this.resizeObserver.unobserve( this.activeTabpanel );
		}
		const panelId = this.activeTab.getAttribute( 'aria-controls' );
		this.activeTabpanel = this.panelIdToPanelMap.get( panelId );

		if ( !this.activeTabpanel ) {
			return;
		}
		this.resizeObserver.observe( this.activeTabpanel );

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
			this.isProgrammaticPanelScroll = true;
			window.requestAnimationFrame( () => {
				this.section.scrollLeft = activeTabpanel.offsetLeft;
			} );
		}
	}

	/**
	 * Reads all necessary layout properties from the DOM in a single batch.
	 *
	 * @param {Element} [tab] - An optional tab to get layout info for.
	 * @return {Object} An object containing layout metrics.
	 * @private
	 */
	getLayoutMetrics( tab ) {
		const tablist = this.tablist;
		const metrics = {
			scrollLeft: Util.roundScrollLeft( tablist.scrollLeft ),
			scrollWidth: tablist.scrollWidth,
			offsetWidth: tablist.offsetWidth,
			clientWidth: tablist.clientWidth,
			headerWidth: this.header.offsetWidth
		};
		if ( tab ) {
			metrics.tabLeft = tab.offsetLeft;
			metrics.tabWidth = tab.offsetWidth;
		}
		return metrics;
	}

	/**
	 * Calculates the new scroll position to bring a tab into view.
	 *
	 * @param {Object} metrics The layout metrics from getLayoutMetrics.
	 * @return {number|null} The new scrollLeft value, or null if no scroll is needed.
	 * @private
	 */
	calculateNewScrollLeft( metrics ) {
		const buttonWidth = metrics.headerWidth * OVERFLOW_BUTTON_WIDTH;

		const hasPrevButton = metrics.scrollLeft > 0;
		const hasNextButton = metrics.scrollLeft + metrics.clientWidth < metrics.scrollWidth;

		const visibleLeft = metrics.scrollLeft + ( hasPrevButton ? buttonWidth : 0 );
		const visibleRight = metrics.scrollLeft + metrics.clientWidth - ( hasNextButton ? buttonWidth : 0 );

		const tabLeft = metrics.tabLeft;
		const tabRight = tabLeft + metrics.tabWidth;

		// If the tab is to the left of the visible area, calculate the new scroll position.
		if ( tabLeft < visibleLeft ) {
			// Position the tab right after the space for the prev button.
			return tabLeft - buttonWidth;
		}

		// If the tab is to the right of the visible area, calculate the new scroll position.
		if ( tabRight > visibleRight ) {
			// Position the tab right before the space for the next button.
			return tabRight - metrics.clientWidth + buttonWidth;
		}

		return null;
	}

	/**
	 * Updates the visibility of previous/next arrow buttons on the tab list.
	 *
	 * @param {Object} [metrics] Optional pre-fetched layout metrics.
	 * @private
	 */
	updateHeaderOverflow( metrics ) {
		const m = metrics || this.getLayoutMetrics();
		this.isOverflowing = m.scrollWidth > m.offsetWidth;

		if ( !this.isOverflowing ) {
			this.header.classList.remove(
				'tabber__header--next-visible',
				'tabber__header--prev-visible'
			);
			return;
		}

		const isAtStart = m.scrollLeft <= 0;
		const isAtEnd = m.scrollLeft + m.offsetWidth >= m.scrollWidth;

		this.header.classList.toggle( 'tabber__header--prev-visible', !isAtStart );
		this.header.classList.toggle( 'tabber__header--next-visible', !isAtEnd );
	}

	/**
	 * Handles clicks on the header area (tabs, prev/next buttons).
	 *
	 * @param {MouseEvent} e
	 */
	onHeaderClick( e ) {
		const tab = e.target.closest( '.tabber__tab' );
		if ( tab ) {
			// So that the browser does not scroll vertically when clicking on a tab.
			e.preventDefault();
			this.setActiveTab( tab, { source: 'user-click' } );
			return;
		}

		if ( IS_POINTER_DEVICE ) {
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
	 * Handles scroll events on the panel section to detect when programmatic scrolling has finished.
	 *
	 * @private
	 */
	onSectionScroll() {
		if ( this.scrollTimeout ) {
			clearTimeout( this.scrollTimeout );
		}
		this.scrollTimeout = setTimeout( () => {
			this.isProgrammaticPanelScroll = false;
		}, 150 );
	}

	/**
	 * Attaches event listeners for an active tabber.
	 *
	 * @private
	 */
	addEventListeners() {
		this.header.addEventListener( 'click', this.onHeaderClick );
		this.section.addEventListener( 'click', this.onSectionClick );
		this.section.addEventListener( 'scroll', this.onSectionScroll );
		this.tablist.addEventListener( 'scroll', this.onTablistScroll );
		this.tablist.addEventListener( 'keydown', this.onTablistKeydown );

		this.resizeObserver.observe( this.tablist );
		if ( this.activeTabpanel ) {
			this.resizeObserver.observe( this.activeTabpanel );
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
		this.section.removeEventListener( 'scroll', this.onSectionScroll );
		this.tablist.removeEventListener( 'scroll', this.onTablistScroll );
		this.tablist.removeEventListener( 'keydown', this.onTablistKeydown );

		this.resizeObserver.unobserve( this.tablist );
		if ( this.activeTabpanel ) {
			this.resizeObserver.unobserve( this.activeTabpanel );
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
		if ( this.isProgrammaticPanelScroll ) {
			return;
		}

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

class TabberController {
	constructor() {
		this.instances = new WeakMap();
		// A single ResizeObserver for all tabbers for performance.
		// eslint-disable-next-line compat/compat
		this.resizeObserver = new ResizeObserver( this.onResize.bind( this ) );
		this.isInitialized = false;
	}

	/**
	 * Handles resize events for all tabber instances.
	 *
	 * @param {ResizeObserverEntry[]} entries
	 */
	onResize( entries ) {
		for ( const { target } of entries ) {
			const tabberEl = target.closest( '.tabber' );
			if ( tabberEl && this.instances.has( tabberEl ) ) {
				this.instances.get( tabberEl ).handleResize( target );
			}
		}
	}

	/**
	 * Handles tab change events delegated from Tabber instances.
	 *
	 * @param {CustomEvent} e
	 */
	onTabChange( e ) {
		if ( !config.updateLocationOnTabChange || e.detail.source !== 'user-click' ) {
			return;
		}

		const newHash = `#${ e.detail.panelId }`;
		// Avoid redundant history updates.
		if ( window.location.hash !== newHash ) {
			history.replaceState(
				null,
				'',
				`${ window.location.pathname }${ window.location.search }${ newHash }`
			);
		}
	}

	/**
	 * Initializes all tabbers on the page.
	 *
	 * @return {Promise<void>}
	 */
	async load() {
		const tabberEls = document.querySelectorAll( '.tabber--init' );
		if ( tabberEls.length === 0 ) {
			return;
		}

		const urlHash = window.location.hash.slice( 1 );
		mw.loader.load( 'ext.tabberNeue.icons' );

		await Promise.all( [ ...tabberEls ].map( ( tabberEl ) => {
			const tabber = new Tabber( tabberEl, this.resizeObserver );
			this.instances.set( tabberEl, tabber );
			return tabber.init( urlHash );
		} ) );

		setTimeout( () => {
			// Delay animations to prevent flashes on page load.
			Tabber.toggleAnimation( true );
		}, 250 );
	}

	/**
	 * Handles URL hash changes to activate the correct tab.
	 */
	handleHashChange() {
		const urlHash = window.location.hash.slice( 1 );
		const panel = Tabber.getPanelFromHash( urlHash );

		if ( panel === null ) {
			return;
		}

		// Find the panel and tabber instance this element belongs to.
		const tabberEl = panel.closest( '.tabber--live' );

		if ( !tabberEl || !this.instances.has( tabberEl ) ) {
			return;
		}

		const instance = this.instances.get( tabberEl );
		const tabToActivate = instance.panelToTabMap.get( panel );

		if ( tabToActivate ) {
			instance.setActiveTab( tabToActivate );
		}
	}

	/**
	 * Main entry point.
	 */
	main() {
		if ( !this.isInitialized ) {
			window.addEventListener( 'hashchange', this.handleHashChange.bind( this ) );
			document.documentElement.addEventListener( 'tabber:tabchange', this.onTabChange.bind( this ) );
			this.isInitialized = true;
		}
		this.load();
	}
}

const controller = new TabberController();

mw.hook( 'wikipage.content' ).add( () => {
	controller.main();
} );

mw.loader.using( 'ext.visualEditor.desktopArticleTarget.init' ).then( () => {
	mw.hook( 'postEdit.afterRemoval' ).add( () => {
		controller.main();
	} );
} );
