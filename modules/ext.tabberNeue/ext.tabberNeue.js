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
 * Class representing TabberEvent functionality for handling tab events and animations.
 *
 * @class
 */
class TabberEvent {
	/**
	 * Determines if animations should be shown based on the user's preference.
	 *
	 * @return {boolean} - Returns true if animations should be shown, false otherwise.
	 */
	static shouldShowAnimation() {
		return !window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches || !config.enableAnimation;
	}

	/**
	 * Toggles the animation state based on the user's preference.
	 * If animations should be shown,
	 * adds the 'tabber-animations-ready' class to the document element.
	 *
	 * @param {boolean} enableAnimations - Flag indicating whether animations should be enabled.
	 */
	static toggleAnimation( enableAnimations ) {
		if ( !TabberEvent.shouldShowAnimation() ) {
			return;
		}
		window.requestAnimationFrame( () => {
			document.documentElement.classList.toggle( 'tabber-animations-ready', enableAnimations );
		} );
	}

	/**
	 * Updates the header overflow based on the scroll position of the tab list.
	 * If the tab list is scrollable, it adds/removes classes to show/hide navigation buttons.
	 *
	 * @param {Element} tabberEl - The tabber element containing the header and tab list.
	 */
	static updateHeaderOverflow( tabberEl ) {
		const header = tabberEl.querySelector( ':scope > .tabber__header' );
		const tablist = header.querySelector( ':scope > .tabber__tabs' );
		const { roundScrollLeft } = Util;
		const tablistWidth = tablist.offsetWidth;
		const tablistScrollWidth = tablist.scrollWidth;
		const isScrollable = ( tablistScrollWidth > header.offsetWidth );

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
			header.classList.toggle( 'tabber__header--next-visible', isAtStart || isAtMiddle );
			header.classList.toggle( 'tabber__header--prev-visible', isAtEnd || isAtMiddle );
		} );
	}

	/**
	 * Updates the tab indicator to visually indicate the active tab.
	 *
	 * @param {Element} tabberEl - The tabber element containing the tabs and indicator.
	 * @param {Element} activeTab - The currently active tab element.
	 */
	static updateIndicator( tabberEl, activeTab ) {
		const indicator = tabberEl.querySelector( '.tabber__indicator' );
		const tablist = tabberEl.querySelector( '.tabber__tabs' );

		window.requestAnimationFrame( () => {
			const width = Util.getElementSize( activeTab, 'width' );
			indicator.style.width = width + 'px';
			indicator.style.transform = 'translateX(' + ( activeTab.offsetLeft - Util.roundScrollLeft( tablist.scrollLeft ) ) + 'px)';
		} );
	}

	static setActiveTabpanel( activeTabpanel ) {
		const section = activeTabpanel.closest( '.tabber__section' );

		if ( activeTabpanel.dataset.mwTabberLoadUrl ) {
			const transclude = new Transclude( activeTabpanel );
			transclude.loadPage();
		}

		window.requestAnimationFrame( () => {
			const activeTabpanelHeight = Util.getElementSize( activeTabpanel, 'height' );
			section.style.height = activeTabpanelHeight + 'px';
			// Scroll to tab
			section.scrollLeft = activeTabpanel.offsetLeft;
		} );
	}

	/**
	 * Sets the active tab based on the provided tab panel ID.
	 * Updates the ARIA attributes for tab panels and tabs to reflect the active state.
	 * Also updates the tab indicator to visually indicate the active tab.
	 *
	 * @param {string} tabpanelId - The ID of the tab panel to set as active.
	 */
	static setActiveTab( tabpanelId ) {
		const activeTabpanel = document.getElementById( tabpanelId );
		const activeTab = document.getElementById( `tab-${ tabpanelId }` );

		const tabberEl = activeTabpanel.closest( '.tabber' );
		const tabpanels = tabberEl.querySelectorAll( ':scope > .tabber__section > .tabber__panel' );
		const tabs = tabberEl.querySelectorAll( ':scope > .tabber__header > .tabber__tabs > .tabber__tab' );

		const tabpanelAttributes = [];
		const tabAttributes = [];

		tabpanels.forEach( ( tabpanel ) => {
			if ( tabpanel === activeTabpanel ) {
				tabpanelAttributes.push( {
					element: tabpanel,
					attributes: {
						'aria-hidden': 'false'
					}
				} );
				if ( typeof resizeObserver !== 'undefined' && resizeObserver ) {
					resizeObserver.observe( activeTabpanel );
				}
			} else {
				tabpanelAttributes.push( {
					element: tabpanel,
					attributes: {
						'aria-hidden': 'true'
					}
				} );
				if ( typeof resizeObserver !== 'undefined' && resizeObserver ) {
					resizeObserver.unobserve( tabpanel );
				}
			}
		} );

		tabs.forEach( ( tab ) => {
			if ( tab === activeTab ) {
				tabAttributes.push( {
					element: tab,
					attributes: {
						'aria-selected': true,
						tabindex: '0'
					}
				} );
			} else {
				tabAttributes.push( {
					element: tab,
					attributes: {
						'aria-selected': false,
						tabindex: '-1'
					}
				} );
			}
		} );

		window.requestAnimationFrame( () => {
			tabpanelAttributes.forEach( ( { element, attributes } ) => {
				Util.setAttributes( element, attributes );
			} );
			tabAttributes.forEach( ( { element, attributes } ) => {
				Util.setAttributes( element, attributes );
			} );
		} );

		TabberEvent.updateIndicator( tabberEl, activeTab );
		TabberEvent.setActiveTabpanel( activeTabpanel );
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
	 * of the TabberEvent class.
	 *
	 * @param {Element} button - The header button element that was clicked.
	 * @param {string} type - The type of button clicked ('prev' or 'next').
	 */
	static handleHeaderButton( button, type ) {
		const tablist = button.closest( '.tabber__header' ).querySelector( '.tabber__tabs' );
		const scrollOffset = type === 'prev' ? -tablist.offsetWidth / 2 : tablist.offsetWidth / 2;
		TabberEvent.scrollTablist( scrollOffset, tablist );
	}

	/**
	 * Handles the click event on a tab element.
	 * If a tab element is clicked, it sets the tab panel as active and updates the URL hash
	 * without adding to browser history.
	 *
	 * @param {Event} e - The click event object.
	 */
	static handleClick( e ) {
		const tab = e.target.closest( '.tabber__tab' );
		if ( tab ) {
			// Prevent default anchor actions
			e.preventDefault();
			const tabpanelId = tab.getAttribute( 'aria-controls' );

			// Update the URL hash without adding to browser history
			if ( config.updateLocationOnTabChange ) {
				history.replaceState( null, '', window.location.pathname + window.location.search + '#' + tabpanelId );
			}
			TabberEvent.setActiveTab( tabpanelId );
			return;
		}

		const isPointerDevice = window.matchMedia( '(hover: hover)' ).matches;
		if ( isPointerDevice ) {
			const prevButton = e.target.closest( '.tabber__header__prev' );
			if ( prevButton ) {
				TabberEvent.handleHeaderButton( prevButton, 'prev' );
				return;
			}

			const nextButton = e.target.closest( '.tabber__header__next' );
			if ( nextButton ) {
				TabberEvent.handleHeaderButton( nextButton, 'next' );
				return;
			}
		}
	}

	/**
	 * Checks if there are entries and the first entry has a target element
	 * that is an instance of Element.
	 * If true, calls the setActiveTabpanel method of the TabberEvent class
	 * with the activeTabpanel as the argument.
	 *
	 * @param {ResizeObserverEntry[]} entries
	 */
	static handleElementResize( entries ) {
		if ( entries && entries.length > 0 ) {
			const activeTabpanel = entries[ 0 ].target;
			if ( activeTabpanel instanceof Element ) {
				TabberEvent.setActiveTabpanel( activeTabpanel );
			}
		}
	}

	/**
	 * Sets up event listeners for tab elements.
	 * Attaches a click event listener to the body content element,
	 * delegating the click event to the tab elements.
	 * When a tab element is clicked, it triggers the handleClick method of the TabberEvent class.
	 */
	static attachEvents() {
		const bodyContent = document.getElementById( 'mw-content-text' );
		bodyContent.addEventListener( 'click', TabberEvent.handleClick );

		if ( window.ResizeObserver ) {
			resizeObserver = new ResizeObserver( TabberEvent.handleElementResize );
		}
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
			role: 'tab',
			'aria-selected': false,
			'aria-controls': tabId,
			href: '#' + tabId,
			id: 'tab-' + tabId
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
			role: 'tabpanel',
			'aria-labelledby': `tab-${ tabId }`,
			id: tabId
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
			mw.log.error( '[TabberNeue] Missing or malformed `data-mw-tabber-title` attribute' );
			return false;
		}

		let tabId;
		if ( config.parseTabName ) {
			tabId = Hash.build( Util.extractTextFromHtml( titleAttr ) );
		} else {
			tabId = Hash.build( titleAttr );
		}

		this.setTabpanelAttributes( tabpanel, tabId );

		return this.createTab( titleAttr, tabId );
	}

	/**
	 * Creates tab elements for each tab panel in the tabber.
	 *
	 * It creates a document fragment to hold the tab elements, then iterates over each tab panel
	 * element in the tabber. For each tab panel, it calls the createTabElement method to create a
	 * corresponding tab element and appends it to the fragment. Finally, it adds the fragment
	 * to the tablist element, sets the necessary attributes for the tablist, and adds a
	 * CSS class for styling.
	 */
	createTabs() {
		const fragment = document.createDocumentFragment();
		const tabpanels = this.tabber.querySelectorAll( ':scope > .tabber__section > .tabber__panel' );
		tabpanels.forEach( ( tabpanel ) => {
			fragment.append( this.createTabElement( tabpanel ) );
		} );

		this.tablist.append( fragment );
		this.tablist.classList.add( 'tabber__tabs' );
		this.tablist.setAttribute( 'role', 'tablist' );
	}

	/**
	 * Creates the indicator element for the tabber.
	 *
	 * This method creates a div element to serve as the indicator for the active tab.
	 * It adds the 'tabber__indicator' CSS class to the indicator element and appends it to the
	 * header of the tabber.
	 */
	createIndicator() {
		const indicator = document.createElement( 'div' );
		indicator.classList.add( 'tabber__indicator' );
		this.header.append( indicator );
	}

	/**
	 * Creates the header elements for the tabber.
	 *
	 * This method creates two buttons for navigating to the previous and next tabs,
	 * adds a tablist element. Finally, it appends all these elements to the header of the tabber.
	 */
	createHeader() {
		const prevButton = document.createElement( 'button' );
		prevButton.classList.add( 'tabber__header__prev' );

		const nextButton = document.createElement( 'button' );
		nextButton.classList.add( 'tabber__header__next' );

		this.header.append( prevButton, this.tablist, nextButton );
	}

	attachEvents() {
		this.tablist.addEventListener( 'scroll', { passive: true }, () => {
			const activeTab = this.tablist.querySelector( '[aria-selected="true"]' );
			TabberEvent.toggleAnimation( false );
			window.requestAnimationFrame( () => {
				TabberEvent.updateHeaderOverflow( this.tabber );
				TabberEvent.updateIndicator( this.tabber, activeTab );
			} );
			// Disable animiation for a short time so that the indicator don't get animated
			setTimeout( () => {
				TabberEvent.toggleAnimation( true );
			}, 250 );
		} );

		let tabFocus = 0;
		const tabs = this.tablist.querySelectorAll( ':scope > .tabber__tab' );
		this.tablist.addEventListener( 'keydown', ( e ) => {
			// Move right
			if ( e.key === 'ArrowRight' || e.key === 'ArrowLeft' ) {
				tabs[ tabFocus ].setAttribute( 'tabindex', '-1' );
				if ( e.key === 'ArrowRight' ) {
					tabFocus++;
					// If we're at the end, go to the start
					if ( tabFocus >= tabs.length ) {
						tabFocus = 0;
					}
					// Move left
				} else if ( e.key === 'ArrowLeft' ) {
					tabFocus--;
					// If we're at the start, move to the end
					if ( tabFocus < 0 ) {
						tabFocus = tabs.length - 1;
					}
				}

				tabs[ tabFocus ].setAttribute( 'tabindex', '0' );
				tabs[ tabFocus ].focus();
			}
		} );

		if ( window.ResizeObserver ) {
			const headerOverflowObserver = new ResizeObserver( mw.util.debounce( 250, () => {
				TabberEvent.updateHeaderOverflow( this.tabber );
			} ) );
			headerOverflowObserver.observe( this.tablist );
		}
	}

	/**
	 * Initializes the TabberBuilder by creating tabs, header, and indicator elements.
	 * Also updates the indicator using TabberEvent.
	 */
	init() {
		this.createTabs();
		this.createHeader();
		this.createIndicator();
		const firstTab = this.tablist.querySelector( '.tabber__tab' );
		const firstTabId = firstTab.getAttribute( 'aria-controls' );
		TabberEvent.setActiveTab( firstTabId );
		TabberEvent.updateHeaderOverflow( this.tabber );
		this.attachEvents();
		this.tabber.classList.add( 'tabber--live' );
	}
}

/**
 * Loads tabbers with the given elements using the provided configuration.
 *
 * @param {NodeList} tabberEls - The elements representing tabbers to be loaded.
 * @return {void}
 */
function load( tabberEls ) {
	mw.loader.load( 'ext.tabberNeue.icons' );

	Hash.init();

	tabberEls.forEach( ( tabberEl ) => {
		const tabberBuilder = new TabberBuilder( tabberEl );
		tabberBuilder.init();
	} );

	const urlHash = window.location.hash;
	if ( Hash.exists( urlHash ) ) {
		TabberEvent.setActiveTab( urlHash );
		const activeTabpanel = document.getElementById( urlHash );
		window.requestAnimationFrame( () => {
			activeTabpanel.scrollIntoView( { behavior: 'auto', block: 'end', inline: 'nearest' } );
		} );
	}

	TabberEvent.attachEvents();
	// Delay animation execution so it doesn't not animate the tab gets into position on load
	setTimeout( () => {
		TabberEvent.toggleAnimation( true );
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
