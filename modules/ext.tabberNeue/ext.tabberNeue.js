/**
 * ext.tabberNeue
 *
 * NAMING THINGS ARE HARD :(
 * TODO: Make class and function names more accurate?
 * TODO: Split classes into different modules
 */
const config = require( './config.json' );
const Hash = require( './Hash.js' );
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
		window.requestAnimationFrame( () => {
			document.documentElement.classList.toggle(
				'tabber-animations-ready',
				enableAnimations
			);
		} );
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
			window.requestAnimationFrame( () => {
				header.classList.remove( 'tabber__header--next-visible' );
				header.classList.remove( 'tabber__header--prev-visible' );
			} );
			return;
		}

		const scrollLeft = roundScrollLeft( tablist.scrollLeft );
		const isAtStart = scrollLeft <= 0;
		const isAtEnd = scrollLeft + tablistWidth >= tablistScrollWidth;
		const isAtMiddle = !isAtStart && !isAtEnd;

		window.requestAnimationFrame( () => {
			header.classList.toggle(
				'tabber__header--next-visible',
				isAtStart || isAtMiddle
			);
			header.classList.toggle(
				'tabber__header--prev-visible',
				isAtEnd || isAtMiddle
			);
		} );
	}

	/**
	 * Animate and update the indicator position and width based on the active tab.
	 *
	 * @param {Element} indicator - The indicator element (optional, defaults to the first '.tabber__indicator' found in the parent).
	 * @param {Element} activeTab - The currently active tab.
	 * @param {Element} tablist - The parent element containing the tabs.
	 */
	static animateIndicator( indicator, activeTab, tablist ) {
		const tablistScrollLeft = Util.roundScrollLeft( tablist.scrollLeft );
		const width = Util.getElementSize( activeTab, 'width' );
		const transformValue = activeTab.offsetLeft - tablistScrollLeft;

		indicator.classList.add( 'tabber__indicator--visible' );
		tablist.classList.add( 'tabber__tabs--animate' );
		indicator.style.width = width + 'px';
		indicator.style.transform = `translateX(${ transformValue }px)`;
		setTimeout( () => {
			indicator.classList.remove( 'tabber__indicator--visible' );
			tablist.classList.remove( 'tabber__tabs--animate' );
		}, 250 );
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
	 * Loads the content of the active tab panel if it has a 'data-mw-tabber-load-url' attribute.
	 * Adjusts the height of the section containing the active tab panel based on its content height.
	 * Scrolls the section to make the active tab panel visible.
	 *
	 * @param {Element} activeTabpanel - The active tab panel element to be set.
	 * @param {Element|null} currentActiveTabpanel - The current active tab panel element
	 */
	static setActiveTabpanel( activeTabpanel, currentActiveTabpanel = null ) {
		const section = activeTabpanel.closest( '.tabber__section' );

		if ( activeTabpanel.dataset.mwTabberLoadUrl ) {
			const transclude = new Transclude( activeTabpanel );
			transclude.loadPage();
		}

		window.requestAnimationFrame( () => {
			const activeTabpanelHeight = Util.getElementSize(
				activeTabpanel,
				'height'
			);
			section.style.height = activeTabpanelHeight + 'px';
			// Scroll to tab
			section.scrollLeft = activeTabpanel.offsetLeft;
		} );

		if ( currentActiveTabpanel ) {
			resizeObserver.unobserve( currentActiveTabpanel );
		}
		resizeObserver.observe( activeTabpanel );
	}

	/**
	 * Sets the active tab in the tabber element.
	 * Updates the attributes of tabs and tab panels to reflect the active state.
	 * Animates the indicator to the active tab and sets the active tab panel.
	 *
	 * @param {Element} activeTab - The tab element to set as active.
	 * @return {Promise} - A promise that resolves once the active tab is set.
	 */
	static setActiveTab( activeTab ) {
		return new Promise( ( resolve ) => {
			const activeTabpanel = TabberAction.getTabpanel( activeTab );
			const tabberEl = activeTabpanel.closest( '.tabber' );
			const indicator = tabberEl.querySelector(
				':scope > .tabber__header > .tabber__indicator'
			);

			const currentActiveTab = tabberEl.querySelector( ':scope > .tabber__header > .tabber__tabs > .tabber__tab[aria-selected="true"]' );
			let currentActiveTabpanel;

			if ( currentActiveTab ) {
				currentActiveTabpanel = TabberAction.getTabpanel( currentActiveTab );
			}

			window.requestAnimationFrame( () => {
				if ( currentActiveTab ) {
					const currentActiveTabAttributes = {
						tabindex: -1,
						'aria-selected': 'false'
					};
					Util.setAttributes( currentActiveTab, currentActiveTabAttributes );

					if ( currentActiveTabpanel ) {
						const currentActiveTabpanelAttributes = {
							tabindex: -1,
							'aria-hidden': 'true'
						};
						Util.setAttributes( currentActiveTabpanel, currentActiveTabpanelAttributes );
					}
				}

				const activeTabAttributes = {
					tabindex: 0,
					'aria-selected': 'true'
				};

				const activeTabpanelAttributes = {
					tabindex: 0,
					'aria-hidden': 'false'
				};

				Util.setAttributes( activeTab, activeTabAttributes );
				Util.setAttributes( activeTabpanel, activeTabpanelAttributes );

				TabberAction.animateIndicator(
					indicator,
					activeTab,
					activeTab.parentElement
				);
				TabberAction.setActiveTabpanel( activeTabpanel, currentActiveTabpanel );
			} );

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
		const scrollLeft = Util.roundScrollLeft( tablist.scrollLeft ) + offset;

		window.requestAnimationFrame( () => {
			tablist.scrollLeft = Math.min(
				Math.max( scrollLeft, 0 ),
				tablist.scrollWidth - tablist.offsetWidth
			);
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
	 * Updates the header overflow if the resized element is a tab list,
	 * or sets the active tab panel if the resized element is a tab panel.
	 *
	 * @param {ResizeObserverEntry[]} entries - An array of ResizeObserverEntry objects.
	 */
	static onResize( entries ) {
		for ( const { target } of entries ) {
			if ( target.classList.contains( 'tabber__tabs' ) ) {
				TabberAction.updateHeaderOverflow( target );
			} else if ( target.classList.contains( 'tabber__panel' ) ) {
				TabberAction.setActiveTabpanel( target );
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
		this.indicator = this.tabber.querySelector(
			':scope > .tabber__header > .tabber__indicator'
		);
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
			this.activeTabpanel = TabberAction.getTabpanel( this.activeTab );

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
 * Class responsible for creating tabs, headers, and indicators for a tabber element.
 *
 * @class TabberBuilder
 */
class TabberBuilder {
	constructor( tabber ) {
		this.tabber = tabber;
		this.header = this.tabber.querySelector( ':scope > .tabber__header' );
		this.tablist = document.createElement( 'nav' );
		this.indicator = document.createElement( 'div' );
	}

	/**
	 * Sets the attributes of a tab element.
	 *
	 * @param {Element} tab - The tab element to set attributes for.
	 * @param {string} tabId - The ID of the tab element.
	 */
	setTabAttributes( tab, tabId ) {
		const tabAttributes = {
			class: 'tabber__tab',
			href: '#' + tabId,
			id: 'tab-' + tabId,
			role: 'tab',
			tabindex: '-1',
			'aria-selected': false,
			'aria-controls': tabId
		};

		Util.setAttributes( tab, tabAttributes );
	}

	/**
	 * Creates a tab element with the given title attribute and tab ID.
	 *
	 * @param {string} titleAttr - The title attribute for the tab element.
	 * @param {string} tabId - The ID of the tab element.
	 * @return {Element} The created tab element.
	 */
	createTab( titleAttr, tabId ) {
		const tab = document.createElement( 'a' );

		if ( config.parseTabName ) {
			tab.innerHTML = titleAttr;
		} else {
			tab.textContent = titleAttr;
		}

		this.setTabAttributes( tab, tabId );

		return tab;
	}

	/**
	 * Sets the attributes of a tab panel element.
	 *
	 * @param {Element} tabpanel - The tab panel element to set attributes for.
	 * @param {string} tabId - The ID of the tab panel element.
	 */
	setTabpanelAttributes( tabpanel, tabId ) {
		const tabpanelAttributes = {
			id: tabId,
			role: 'tabpanel',
			tabindex: '-1',
			'aria-hidden': 'true',
			'aria-labelledby': `tab-${ tabId }`
		};

		Util.setAttributes( tabpanel, tabpanelAttributes );
	}

	/**
	 * Creates a tab element based on the provided tab panel.
	 *
	 * @param {Element} tabpanel - The tab panel element to create a tab element for.
	 * @return {Element|false} The created tab element, or false if the title attribute is missing
	 * or malformed.
	 */
	createTabElement( tabpanel ) {
		const titleAttr = tabpanel.dataset.mwTabberTitle;

		if ( !titleAttr ) {
			mw.log.error(
				'[TabberNeue] Missing or malformed `data-mw-tabber-title` attribute'
			);
			return false;
		}

		let tabId;
		if ( config.parseTabName ) {
			tabId = Util.extractTextFromHtml( titleAttr );
		} else {
			tabId = titleAttr;
		}

		tabId = Hash.build( tabId, config.useLegacyTabIds );

		this.setTabpanelAttributes( tabpanel, tabId );

		return this.createTab( titleAttr, tabId );
	}

	/**
	 * Creates tabs for the tabber.
	 *
	 * This method creates tab elements for each tab panel in the tabber.
	 * It appends the created tabs to the tablist element, adds necessary attributes,
	 * and sets the role attribute for accessibility.
	 *
	 * @return {Promise} A promise that resolves once all tabs are created and appended to the tablist.
	 */
	createTabs() {
		return new Promise( ( resolve ) => {
			const fragment = document.createDocumentFragment();
			const tabpanels = this.tabber.querySelectorAll(
				':scope > .tabber__section > .tabber__panel'
			);
			tabpanels.forEach( ( tabpanel ) => {
				fragment.append( this.createTabElement( tabpanel ) );
			} );

			this.tablist.append( fragment );
			this.tablist.classList.add( 'tabber__tabs' );
			this.tablist.setAttribute( 'role', 'tablist' );
			resolve();
		} );
	}

	/**
	 * Creates the indicator element for the tabber.
	 *
	 * This method creates a div element to serve as the indicator for the active tab.
	 * The indicator element is given a specific CSS class for styling and is appended to the tabber header.
	 *
	 * @return {Promise} A promise that resolves once the indicator element is created.
	 */
	createIndicator() {
		return new Promise( ( resolve ) => {
			const indicator = document.createElement( 'div' );
			indicator.classList.add( 'tabber__indicator' );
			this.header.append( indicator );
			resolve();
		} );
	}

	/**
	 * Creates the header for the tabber.
	 *
	 * This method creates two button elements, one for navigating to the previous tab and one for navigating to the next tab.
	 * Each button element is created with the specified class and aria-label attributes.
	 * The created buttons are appended to the header of the tabber.
	 *
	 * @return {Promise} A promise that resolves once the header is created.
	 */
	createHeader() {
		return new Promise( ( resolve ) => {
			/**
			 * Creates a button element with the specified class and aria-label.
			 *
			 * @param {string} className - The class name for the button element.
			 * @param {string} ariaLabel - The aria-label attribute for the button element.
			 * @return {Element} The created button element.
			 */
			const createButton = ( className, ariaLabel ) => {
				const button = document.createElement( 'button' );
				// eslint-disable-next-line mediawiki/class-doc
				button.classList.add( className );
				button.setAttribute( 'aria-label', ariaLabel );
				return button;
			};

			const prevButton = createButton( 'tabber__header__prev', mw.message( 'tabberneue-button-prev' ).text() );
			const nextButton = createButton( 'tabber__header__next', mw.message( 'tabberneue-button-next' ).text() );

			this.header.append( prevButton, this.tablist, nextButton );
			resolve();
		} );
	}

	/**
	 * Initializes the tabber by creating tabs, header, and indicator elements sequentially.
	 * Sets the active tab based on the URL hash, and updates the header overflow.
	 * Attaches event listeners for tabber interaction.
	 *
	 * @param {string} urlHash - The URL hash used to set the active tab.
	 * @return {void}
	 */
	async init( urlHash ) {
		// Create tabs, header, and indicator elements sequentially
		await this.createTabs();
		await this.createHeader();
		await this.createIndicator();

		const activeTab = this.tablist.querySelector( `#tab-${ CSS.escape( urlHash ) }` ) || this.tablist.firstElementChild;
		TabberAction.setActiveTab( activeTab );
		TabberAction.updateHeaderOverflow( this.tablist );

		// Start attaching event
		setTimeout( () => {
			const tabberEvent = new TabberEvent( this.tabber, this.tablist );
			tabberEvent.init();
		}, 0 );

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

	Hash.init();

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
			const newHash = window.location.hash.slice( 1 );
			const tab = document.getElementById( `tab-${ CSS.escape( newHash ) }` );
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
	const tabberEls = document.querySelectorAll( '.tabber:not(.tabber--live)' );

	if ( tabberEls.length === 0 ) {
		return;
	}

	load( tabberEls );
}

mw.hook( 'wikipage.content' ).add( () => {
	main();
} );

mw.loader.using( 'ext.visualEditor.desktopArticleTarget.init' ).done( () => {
	// After saving edits
	mw.hook( 'postEdit.afterRemoval' ).add( () => {
		main();
	} );
} );
