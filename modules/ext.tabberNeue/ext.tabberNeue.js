/**
 * ext.tabberNeue
 *
 * NAMING THINGS ARE HARD :(
 * TODO: Make class and function names more accurate?
 * TODO: Split classes into different modules
 */
const config = require( './config.json' );

let uniqueHashes;
let resizeObserver;

/**
 * Class representing a Hash utility for generating unique hash values.
 *
 * @class Hash
 */
class Hash {
	/**
	 * Initializes the Hash class by creating a new Set to store unique hashes.
	 */
	static init() {
		uniqueHashes = new Set();
	}

	/**
	 * Checks if a given hash is not unique by verifying if it exists in the Set of unique hashes.
	 *
	 * @param {string} hash - The hash to check for uniqueness.
	 * @return {boolean} - Returns true if the hash is not unique, false otherwise.
	 */
	static exists( hash ) {
		return uniqueHashes.has( hash );
	}

	/**
	 * Generates a unique hash based on the input hash by appending a suffix if necessary.
	 *
	 * @param {string} hash - The base hash to make unique.
	 * @return {string} - A unique hash derived from the input hash.
	 */
	static makeUnique( hash ) {
		const match = hash.match( /^(.+)_([0-9]+)$/ );
		let suffix = match ? parseInt( match[ 2 ], 10 ) + 1 : 1;

		const initialHash = hash;

		let uniqueHash = `${ initialHash }_${ suffix }`;
		// Increment suffix and generate a new unique hash until a unique one is found
		while ( Hash.exists( uniqueHash ) ) {
			suffix++;
			uniqueHash = `${ initialHash }_${ suffix }`;
		}

		return uniqueHash;
	}

	/**
	 * Builds a unique hash based on the provided title text.
	 *
	 * @param {string} titleText - The title text to generate the hash from.
	 * @return {string} - A unique hash created from the title text.
	 */
	static build( titleText ) {
		let hash = mw.util.escapeIdForAttribute( titleText );

		if ( Hash.exists( hash ) ) {
			hash = Hash.makeUnique( hash );
		}

		uniqueHashes.add( hash );
		return hash;
	}

	/**
	 * Clears the Set of unique hashes, removing all stored hashes.
	 */
	static clear() {
		uniqueHashes.clear();
	}
}

/**
 * Utility class with methods for common utility functions.
 *
 * @class Util
 */
class Util {
	/**
	 * Extracts text content from the given HTML string.
	 *
	 * @param {string} html - The HTML string to extract text content from.
	 * @return {string} The extracted text content.
	 */
	static extractTextFromHtml( html ) {
		const tmp = document.createElement( 'div' );
		tmp.innerHTML = html;
		return tmp.textContent;
	}

	/**
	 * Returns the size (width or height) of the provided element.
	 * Required to calculate the size of hidden elements (e.g. nested tabs)
	 *
	 * @param {Element} element - The element for which to get the size.
	 * @param {string} type - The type of size to retrieve ('width' or 'height').
	 * @return {number} The actual size of the element based on the specified type.
	 */
	static getElementSize( element, type ) {
		if ( !element || !( element instanceof Element ) || ( type !== 'width' && type !== 'height' ) ) {
			mw.log.error( '[TabberNeue] Invalid element or type provided for getElementSize' );
			return 0;
		}

		let value = element.getBoundingClientRect()[ type ];

		if ( value === 0 ) {
			value = this.getHiddenElementSize( element, type );
		}

		return value;
	}

	/**
	 * Retrieves the size of a hidden element by cloning it and calculating the size.
	 *
	 * @param {Element} element - The hidden element to retrieve the size from.
	 * @param {string} type - The type of size to retrieve ('width' or 'height').
	 * @return {number} The size of the hidden element based on the specified type.
	 */
	static getHiddenElementSize( element, type ) {
		const shadowRoot = document.createElement( 'div' ).attachShadow( { mode: 'open' } );
		const clone = element.cloneNode( true );
		clone.style.position = 'absolute';
		clone.style.visibility = 'hidden';
		shadowRoot.appendChild( clone );
		try {
			const value = clone.getBoundingClientRect()[ type ];
			return value;
		} finally {
			clone.parentNode.removeChild( clone );
		}
	}

	/**
	 * Rounds the scrollLeft value to the nearest integer using Math.ceil.
	 * Used to avoid the fractional pixel issue caused by different browser implementations
	 *
	 * @param {number} val - The scrollLeft value to be rounded.
	 * @return {number} The rounded scrollLeft value.
	 */
	static roundScrollLeft( val ) {
		return Math.ceil( val );
	}

	/**
	 * Sets the attributes of the given element based on the provided attributes object.
	 *
	 * @param {Element} element - The element to set attributes for.
	 * @param {Object} attributes - An object containing key-value pairs of attributes to set.
	 */
	static setAttributes( element, attributes ) {
		for ( const key in attributes ) {
			element.setAttribute( key, attributes[ key ] );
		}
	}
}

/**
 * Represents a class that handles transcluding content for a tab within a tabber component.
 *
 * @class TabberTransclude
 */
class TabberTransclude {
	constructor( activeTabpanel, cacheExpiration = 3600 ) {
		this.activeTabpanel = activeTabpanel;
		this.pageTitle = this.activeTabpanel.dataset.mwTabberPageTitle;
		this.url = this.activeTabpanel.dataset.mwTabberLoadUrl;
		this.cacheKey = `tabber-transclude-${ encodeURIComponent( this.pageTitle ) }_v1`;
		this.cacheExpiration = cacheExpiration;
	}

	/**
	 * Validates the URL format.
	 *
	 * @return {Promise} A Promise that resolves if the URL is valid, and rejects with an Error if the URL is empty, null, or in an invalid format.
	 */
	validateUrl() {
		const urlPattern = /^(https?):\/\/[^\s/$.?#][^\s]*$/;
		if ( !this.url || this.url.trim() === '' ) {
			return Promise.reject( new Error( '[TabberNeue] URL is empty or null' ) );
		}
		if ( !urlPattern.test( this.url ) ) {
			return Promise.reject( new Error( `[TabberNeue] Invalid URL format : ${ this.url }` ) );
		}
		return Promise.resolve();
	}

	/**
	 * Checks the session storage for cached data using the cache key.
	 *
	 * @return {Object|null} The cached data if found, or null if no cached data is found.
	 */
	checkCache() {
		const cachedData = mw.storage.session.getObject( this.cacheKey );
		if ( cachedData ) {
			return cachedData;
		}
		return null;
	}

	/**
	 * Fetches data from the specified URL using a GET request.
	 *
	 * @return {Promise} A Promise that resolves with the response text if the network request is successful,
	 *                    and rejects with an Error if there is an issue with the network request.
	 */
	async fetchDataFromUrl() {
		try {
			const response = await fetch( this.url, { method: 'GET', timeout: 5000, credentials: 'same-origin' } );
			if ( !response.ok ) {
				throw new Error( `Network response was not ok: ${ response.status } - ${ response.statusText }` );
			}
			return Promise.resolve( response.text() );
		} catch ( error ) {
			return Promise.reject( `[TabberNeue] Error fetching data from URL: ${ this.url }`, error );
		}
	}

	/**
	 * Parses the JSON data and extracts the 'parse.text' property.
	 *
	 * @param {string} data - The JSON data to be parsed.
	 * @return {string} The parsed 'parse.text' property from the JSON data.
	 * @throws {Error} If an error occurs while parsing the JSON data.
	 */
	parseData( data ) {
		let parsedData;
		try {
			parsedData = JSON.parse( data );
			parsedData = parsedData.parse.text;
		} catch ( error ) {
			mw.log.error( `[TabberNeue] Error occurred while parsing JSON data: ${ error }` );
			return Promise.reject( new Error( `Error parsing JSON data: ${ error }` ) );
		}
		return parsedData;
	}

	/**
	 * Caches the parsed data in the session storage using the cache key.
	 *
	 * @param {string} parsedData - The parsed data to be cached.
	 * @return {string} The cached parsed data.
	 */
	cacheData( parsedData ) {
		mw.storage.session.setObject( this.cacheKey, parsedData, this.cacheExpiration );
		return parsedData;
	}

	/**
	 * Fetches data by validating the URL, checking the cache, fetching data from the URL,
	 * parsing the data, and caching the parsed data if not found in the cache.
	 *
	 * @return {Promise} A Promise that resolves with the fetched and cached data,
	 *                    or rejects with an error message if any step fails.
	 */
	async fetchData() {
		try {
			await this.validateUrl();
			const cachedData = this.checkCache();
			if ( cachedData ) {
				return cachedData;
			}

			const data = await this.fetchDataFromUrl();
			const parsedData = this.parseData( data );
			return this.cacheData( parsedData );
		} catch ( error ) {
			return Promise.reject( `[TabberNeue] Error fetching data: ${ error }` );
		}
	}

	/**
	 * Loads the page content by fetching data, updating the active tab panel's content,
	 * and handling errors if data fetching fails.
	 *
	 * @return {void}
	 */
	async loadPage() {
		try {
			this.activeTabpanel.classList.add( 'tabber__panel--loading' );
			const data = await this.fetchData();
			if ( data ) {
				delete this.activeTabpanel.dataset.mwTabberLoadUrl;
				this.activeTabpanel.classList.remove( 'tabber__panel--loading' );
				this.activeTabpanel.innerHTML = data;
			} else {
				mw.log.error( `[TabberNeue] No valid API response or missing 'parse' field for ${ this.pageTitle } from: ${ this.url }` );
			}
		} catch ( error ) {
			mw.log.error( `[TabberNeue] Failed to load data for ${ this.pageTitle }: ${ error }` );
		}
	}
}

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
		document.documentElement.classList.toggle( 'tabber-animations-ready', enableAnimations );
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
			const tabberTransclude = new TabberTransclude( activeTabpanel );
			tabberTransclude.loadPage();
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

		[ ...tabpanels ].forEach( ( tabpanel ) => {
			tabpanel.setAttribute( 'aria-hidden', 'true' );
			if ( typeof resizeObserver !== 'undefined' && resizeObserver ) {
				resizeObserver.unobserve( tabpanel );
			}
		} );

		[ ...tabs ].forEach( ( tab ) => {
			tab.setAttribute( 'aria-selected', 'false' );
		} );

		// Ensure `resizeObserver` is defined before using it
		if ( typeof resizeObserver !== 'undefined' && resizeObserver ) {
			resizeObserver.observe( activeTabpanel );
		}
		activeTabpanel.setAttribute( 'aria-hidden', 'false' );
		activeTab.setAttribute( 'aria-selected', 'true' );

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
		[ ...tabpanels ].forEach( ( tabpanel ) => {
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

	/**
	 * Attach events to the tabber element.
	 * This method checks if the window has ResizeObserver support and
	 * creates an observer to update the header overflow.
	 * If ResizeObserver is supported,it creates an observer to
	 * call TabberEvent.updateHeaderOverflow method with a debounce of 250ms.
	 * The observer is then set to observe the tablist element of the tabber.
	 */
	attachEvents() {
		this.tablist.addEventListener( 'scroll', () => {
			window.requestAnimationFrame( () => {
				const activeTab = this.tablist.querySelector( '[aria-selected="true"]' );
				TabberEvent.toggleAnimation( false );
				TabberEvent.updateHeaderOverflow( this.tabber );
				TabberEvent.updateIndicator( this.tabber, activeTab );
				// Disable animiation for a short time so that the indicator don't get animated
				setTimeout( () => {
					TabberEvent.toggleAnimation( true );
				}, 100 );
			} );
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

	const style = document.getElementById( 'tabber-style' );
	if ( style ) {
		style.remove();
	}

	const urlHash = new mw.Uri( location.href ).fragment;
	if ( Hash.exists( urlHash ) ) {
		TabberEvent.setActiveTab( urlHash );
		const activeTabpanel = document.getElementById( urlHash );
		window.requestAnimationFrame( () => {
			activeTabpanel.scrollIntoView( { behavior: 'auto', block: 'end', inline: 'nearest' } );
		} );
	}

	TabberEvent.toggleAnimation( true );
	TabberEvent.attachEvents();
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
