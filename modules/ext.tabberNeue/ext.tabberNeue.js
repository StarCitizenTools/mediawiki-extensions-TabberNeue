/**
 * ext.tabberNeue
 *
 * NAMING THINGS ARE HARD :(
 * TODO: Make class and function names more accurate?
 * TODO: Split classes into different modules
 */
const config = require( './config.json' );
const Transclude = require( './Transclude.js' );
const Util = require( './Util.js' );

let resizeObserver;
/**
 * Class representing TabberAction functionality for handling tab events and animations.
 *
 * @class
 */
class TabberAction {
	/**
	 * Determines if animations should be shown based on the user's preference.
	 *
	 * @return {boolean} - Returns true if animations should be shown, false otherwise.
	 */
	static shouldShowAnimation() {
		return (
			!window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches &&
            config.enableAnimation
		);
	}

	/**
	 * Toggles the animation state based on the user's preference.
	 * If animations should be shown,
	 * adds the 'tabber-animations-ready' class to the document element.
	 *
	 * @param {boolean} enableAnimations - Flag indicating whether animations should be enabled.
	 */
	static toggleAnimation( enableAnimations ) {
		if ( !TabberAction.shouldShowAnimation() ) {
			return;
		}
		document.documentElement.classList.toggle(
			'tabber-animations-ready',
			enableAnimations
		);
	}

	/**
	 * Updates the header overflow based on the scroll position of the tab list.
	 * If the tab list is scrollable, it adds/removes classes to show/hide navigation buttons.
	 *
	 * @param {Element} tablist - The tablist element in the tabber
	 */
	static updateHeaderOverflow( tablist ) {
		const header = tablist.closest( '.tabber__header' );
		const { roundScrollLeft } = Util;
		const tablistWidth = tablist.offsetWidth;
		const tablistScrollWidth = tablist.scrollWidth;
		const isScrollable = tablistScrollWidth > tablistWidth;

		if ( !isScrollable ) {
			header.classList.remove( 'tabber__header--next-visible' );
			header.classList.remove( 'tabber__header--prev-visible' );
			return;
		}

		const scrollLeft = roundScrollLeft( tablist.scrollLeft );
		const isAtStart = scrollLeft <= 0;
		const isAtEnd = scrollLeft + tablistWidth >= tablistScrollWidth;
		const isAtMiddle = !isAtStart && !isAtEnd;

		header.classList.toggle(
			'tabber__header--next-visible',
			isAtStart || isAtMiddle
		);
		header.classList.toggle(
			'tabber__header--prev-visible',
			isAtEnd || isAtMiddle
		);
	}

	/**
	 * Returns the tabpanel element based on the tab element
	 *
	 * @param {Element} tab - The tab element
	 * @return {Element} The tabpanel element.
	 */
	static getTabpanel( tab ) {
		return document.getElementById( tab.getAttribute( 'aria-controls' ) );
	}

	/**
	 * Sets the active tab panel in the tabber element.
	 * Loads the content of the active tab panel if it is a valid transclusion.
	 * Adjusts the height of the section containing the active tab panel based on its content height.
	 * Scrolls the section to make the active tab panel visible.
	 *
	 * @param {Element} activeTabpanel - The active tab panel element to be set.
	 */
	static setActiveTabpanel( activeTabpanel ) {
		const section = activeTabpanel.closest( '.tabber__section' );

		if ( activeTabpanel.querySelector( '.tabber__transclusion' ) ) {
			// TODO: wgCdnMaxAge might not be the best way to handle caching
			const transclude = new Transclude( activeTabpanel, config.cdnMaxAge );
			transclude.loadPage();
		}

		const activeTabpanelHeight = Util.getElementSize(
			activeTabpanel,
			'height'
		);
		section.style.height = activeTabpanelHeight + 'px';

		window.requestAnimationFrame( () => {
			// Scroll to tab
			section.scrollLeft = activeTabpanel.offsetLeft;
		} );
	}

	/**
	 * Sets the active tab in the tabber element.
	 * Updates the attributes of tabs and tab panels to reflect the active state.
	 *
	 * @param {Element} activeTab - The tab element to set as active.
	 * @return {Promise} - A promise that resolves once the active tab is set.
	 */
	static setActiveTab( activeTab ) {
		return new Promise( ( resolve ) => {
			const activeTabpanel = TabberAction.getTabpanel( activeTab );
			const tabberEl = activeTabpanel.closest( '.tabber' );

			const currentActiveTab = tabberEl.querySelector( ':scope > .tabber__header > .tabber__tabs > .tabber__tab[aria-selected="true"]' );

			if ( currentActiveTab ) {
				const currentActiveTabAttributes = {
					tabindex: -1,
					'aria-selected': 'false'
				};
				Util.setAttributes( currentActiveTab, currentActiveTabAttributes );
			}

			const activeTabAttributes = {
				tabindex: 0,
				'aria-selected': 'true'
			};

			Util.setAttributes( activeTab, activeTabAttributes );
			TabberAction.setActiveTabpanel( activeTabpanel );

			resolve();
		} );
	}

	/**
	 * Scrolls the tab list by the specified offset.
	 *
	 * @param {number} offset - The amount to scroll the tab list by.
	 * @param {Element} tablist - The tab list element to scroll.
	 */
	static scrollTablist( offset, tablist ) {
		const getToScroll = () => {
			const scrollLeft = Util.roundScrollLeft( tablist.scrollLeft ) + offset;
			return Math.min(
				Math.max( scrollLeft, 0 ),
				tablist.scrollWidth - tablist.offsetWidth
			);
		};
		const toScroll = getToScroll();
		window.requestAnimationFrame( () => {
			tablist.scrollLeft = toScroll;
		} );
	}

	/**
	 * Handles the click event on a header button element.
	 * Calculates the scroll offset based on the button type ('prev' or 'next').
	 * Scrolls the tab list by the calculated offset using the 'scrollTablist' method
	 * of the TabberAction class.
	 *
	 * @param {Element} button - The header button element that was clicked.
	 * @param {string} type - The type of button clicked ('prev' or 'next').
	 */
	static handleHeaderButton( button, type ) {
		const tablist = button
			.closest( '.tabber__header' )
			.querySelector( '.tabber__tabs' );
		const tablistWidth = tablist.offsetWidth;
		const scrollOffset =
            type === 'prev' ? -tablistWidth / 2 : tablistWidth / 2;
		TabberAction.scrollTablist( scrollOffset, tablist );
	}

	/**
	 * Handles the resize event for tabber elements.
	 * Updates the header overflow if the resized element is a tablist
	 *
	 * @param {ResizeObserverEntry[]} entries - An array of ResizeObserverEntry objects.
	 */
	static onResize( entries ) {
		for ( const { target } of entries ) {
			switch ( true ) {
				case target.classList.contains( 'tabber__tabs' ):
					TabberAction.updateHeaderOverflow( target );
					break;
				case target.classList.contains( 'tabber__panel' ):
					TabberAction.setActiveTabpanel( target );
					break;
			}
		}
	}
}

/**
 * Represents a TabberEvent class that handles events related to tab navigation.
 *
 * @class TabberEvent
 * @param {Element} tabber - The tabber element containing the tabs and header.
 * @param {Element} tablist - The tab list element containing the tab elements.
 */
class TabberEvent {
	constructor( tabber, tablist ) {
		this.tabber = tabber;
		this.tablist = tablist;
		this.header = this.tablist.parentElement;
		this.tabs = this.tablist.querySelectorAll( ':scope > .tabber__tab' );
		this.activeTab = this.tablist.querySelector( '[aria-selected="true"]' );
		this.activeTabpanel = TabberAction.getTabpanel( this.activeTab );
		this.tabFocus = 0;
		this.debouncedUpdateHeaderOverflow = mw.util.debounce(
			() => TabberAction.updateHeaderOverflow( this.tablist ),
			100
		);
		this.handleTabFocusChange = this.handleTabFocusChange.bind( this );
		this.onHeaderClick = this.onHeaderClick.bind( this );
		this.onTablistScroll = this.onTablistScroll.bind( this );
		this.onTablistKeydown = this.onTablistKeydown.bind( this );
	}

	/**
	 * Returns a debounced function that updates the header overflow.
	 *
	 * @return {Function} A debounced function that updates the header overflow.
	 */
	debounceUpdateHeaderOverflow() {
		return this.debouncedUpdateHeaderOverflow;
	}

	/**
	 * Handles changing the focus to the tab based on the key pressed.
	 *
	 * @param {string} key - The key pressed ('home' or 'end' or 'right' or 'left').
	 */
	handleTabFocusChange( key ) {
		this.tabs[ this.tabFocus ].setAttribute( 'tabindex', '-1' );
		if ( key === 'home' ) {
			this.tabFocus = 0;
		} else if ( key === 'end' ) {
			this.tabFocus = this.tabs.length - 1;
		} else if ( key === 'right' ) {
			this.tabFocus = ( this.tabFocus + 1 ) % this.tabs.length;
		} else if ( key === 'left' ) {
			this.tabFocus =
                ( this.tabFocus - 1 + this.tabs.length ) % this.tabs.length;
		}

		this.tabs[ this.tabFocus ].setAttribute( 'tabindex', '0' );
		this.tabs[ this.tabFocus ].focus();
	}

	/**
	 * Handles the click event on the tabber header.
	 * If a tab is clicked, it sets the active tab, updates the URL hash without adding to browser history,
	 * and sets the active tab using TabberAction.setActiveTab method.
	 * If a previous or next button is clicked on a pointer device, it handles the header button accordingly.
	 *
	 * @param {Event} e - The click event object.
	 */
	onHeaderClick( e ) {
		const tab = e.target.closest( '.tabber__tab' );
		if ( tab ) {
			// Prevent default anchor actions
			e.preventDefault();
			this.activeTab = tab;
			resizeObserver.unobserve( this.activeTabpanel );
			this.activeTabpanel = TabberAction.getTabpanel( this.activeTab );
			resizeObserver.observe( this.activeTabpanel );

			// Update the URL hash without adding to browser history
			if ( config.updateLocationOnTabChange ) {
				history.replaceState(
					null,
					'',
					window.location.pathname +
                        window.location.search +
                        '#' +
                        this.activeTab.getAttribute( 'aria-controls' )
				);
			}
			TabberAction.setActiveTab( this.activeTab );
			return;
		}

		const isPointerDevice = window.matchMedia( '(hover: hover)' ).matches;
		if ( isPointerDevice ) {
			const prevButton = e.target.closest( '.tabber__header__prev' );
			if ( prevButton ) {
				TabberAction.handleHeaderButton( prevButton, 'prev' );
				return;
			}

			const nextButton = e.target.closest( '.tabber__header__next' );
			if ( nextButton ) {
				TabberAction.handleHeaderButton( nextButton, 'next' );
				return;
			}
		}
	}

	/**
	 * Update the header overflow based on the scroll position of the tablist.
	 */
	onTablistScroll() {
		this.debouncedUpdateHeaderOverflow();
	}

	/**
	 * Handles the keydown event on the tablist element.
	 * If the key pressed is 'Home', it changes the focus to the first tab.
	 * If the key pressed is 'End', it changes the focus to the last tab.
	 * If the key pressed is 'ArrowRight', it changes the focus to the next tab.
	 * If the key pressed is 'ArrowLeft', it changes the focus to the previous tab.
	 *
	 * @param {Event} e - The keydown event object.
	 */
	onTablistKeydown( e ) {
		if ( e.key === 'Home' ) {
			e.preventDefault();
			this.handleTabFocusChange( 'home' );
		} else if ( e.key === 'End' ) {
			e.preventDefault();
			this.handleTabFocusChange( 'end' );
		} else if ( e.key === 'ArrowRight' ) {
			this.handleTabFocusChange( 'right' );
		} else if ( e.key === 'ArrowLeft' ) {
			this.handleTabFocusChange( 'left' );
		}
	}

	/**
	 * Adds listeners for header click, tablist scroll, tablist keydown, and activeTabpanel resize.
	 */
	resume() {
		this.header.addEventListener( 'click', this.onHeaderClick );
		this.tablist.addEventListener( 'scroll', this.onTablistScroll );
		this.tablist.addEventListener( 'keydown', this.onTablistKeydown );
		resizeObserver.observe( this.tablist );
		resizeObserver.observe( this.activeTabpanel );
	}

	/**
	 * Removes listeners for header click, tablist scroll, tablist keydown, and activeTabpanel resize.
	 */
	pause() {
		this.header.removeEventListener( 'click', this.onHeaderClick );
		this.tablist.removeEventListener( 'scroll', this.onTablistScroll );
		this.tablist.removeEventListener( 'keydown', this.onTablistKeydown );
		resizeObserver.unobserve( this.tablist );
		resizeObserver.unobserve( this.activeTabpanel );
	}

	/**
	 * Initializes the TabberEvent instance by creating an IntersectionObserver to handle tabber visibility.
	 * When the tabber intersects with the viewport, it resumes all event listeners and observers.
	 * Otherwise, it pauses the event listeners and observers.
	 */
	init() {
		// eslint-disable-next-line compat/compat
		this.observer = new IntersectionObserver( ( entries ) => {
			entries.forEach( ( entry ) => {
				if ( entry.isIntersecting ) {
					this.resume();
				} else {
					this.pause();
				}
			} );
		} );
		this.observer.observe( this.tabber );
		// Need to unobserve active tabpanels first so that only the ones in viewport are observed
		resizeObserver.unobserve( this.activeTabpanel );
		this.resume();
	}
}

/**
 * Class responsible for initalizing a tabber element.
 *
 * @class TabberBuilder
 */
class TabberBuilder {
	constructor( tabber ) {
		this.tabber = tabber;
		this.tablist = tabber.querySelector( ':scope > .tabber__header > .tabber__tabs' );
	}

	/**
	 * Sets the attributes of a tab element.
	 */
	setTabsAttributes() {
		const tabAttributes = {
			tabindex: '-1',
			'aria-selected': 'false'
		};
		for ( const tab of this.tablist.children ) {
			Util.setAttributes( tab, tabAttributes );
		}
	}

	/**
	 * Get the active tab in init state
	 *
	 * @param {string} urlHash - The URL hash used to set the active tab.
	 * @return {HTMLElement}
	 */
	getActiveTab( urlHash ) {
		const activeTab = this.tablist.firstElementChild;
		if ( !urlHash ) {
			return activeTab;
		}
		const activeTabFromUrlHash = Util.selectElementFromUrlHash( urlHash );
		if ( !activeTabFromUrlHash ) {
			return activeTab;
		}
		if ( activeTabFromUrlHash.closest( '.tabber__tabs' ) !== this.tablist ) {
			return activeTab;
		}
		return activeTabFromUrlHash;
	}

	/**
	 * Sets the tabs attributes
	 * Sets the active tab based on the URL hash, and updates the header overflow.
	 * Attaches event listeners for tabber interaction.
	 *
	 * @param {string} urlHash - The URL hash used to set the active tab.
	 * @return {void}
	 */
	async init( urlHash ) {
		const activeTab = this.getActiveTab( urlHash );
		this.setTabsAttributes();
		await TabberAction.setActiveTab( activeTab );
		TabberAction.updateHeaderOverflow( this.tablist );

		// Start attaching event
		const tabberEvent = new TabberEvent( this.tabber, this.tablist );
		tabberEvent.init();
		this.tabber.classList.remove( 'tabber--init' );
		this.tabber.classList.add( 'tabber--live' );
	}
}

/**
 * Loads tabbers with the given elements using the provided configuration.
 *
 * @param {NodeList} tabberEls - The elements representing tabbers to be loaded.
 * @return {void}
 */
async function load( tabberEls ) {
	const urlHash = window.location.hash.slice( 1 );

	mw.loader.load( 'ext.tabberNeue.icons' );

	// eslint-disable-next-line compat/compat
	resizeObserver = new ResizeObserver( TabberAction.onResize );

	await Promise.all( [ ...tabberEls ].map( async ( tabberEl ) => {
		const tabberBuilder = new TabberBuilder( tabberEl );
		await tabberBuilder.init( urlHash );
	} ) );

	setTimeout( () => {
		// Delay animation execution so it doesn't not animate the tab gets into position on load
		TabberAction.toggleAnimation( true );
		window.addEventListener( 'hashchange', ( event ) => {
			const hash = window.location.hash.slice( 1 );
			const tab = Util.selectElementFromUrlHash( hash );
			if ( tab ) {
				event.preventDefault();
				tab.click();
			}
		} );
	}, 250 );
}

/**
 * Main function that initializes the tabber functionality on the page.
 * It selects all tabber elements that are not live, checks if there are any tabber elements
 * present, and then calls the load function to load the tabber functionality on
 * each tabber element.
 */
function main() {
	const tabberEls = document.querySelectorAll( '.tabber--init' );

	if ( tabberEls.length === 0 ) {
		return;
	}

	load( tabberEls );
}

mw.hook( 'wikipage.content' ).add( () => {
	main();
} );

mw.loader.using( 'ext.visualEditor.desktopArticleTarget.init' ).then( () => {
	// After saving edits
	mw.hook( 'postEdit.afterRemoval' ).add( () => {
		main();
	} );
} );
