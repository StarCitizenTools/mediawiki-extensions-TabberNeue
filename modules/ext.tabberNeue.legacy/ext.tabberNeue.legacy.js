const ACTIVETAB_SELECTOR = '[aria-selected="true"]';
const ACTIVEPANEL_SELECTOR = '[aria-hidden="false"]';

const sizeProperties = Object.freeze( {
	width: 'offsetWidth',
	height: 'offsetHeight'
} );

// Temp element used by various extractTextFromHtml and getActualSize
const tempElement = document.createElement( 'div' );

/**
 * Rounds the scrollLeft value to the nearest integer using Math.ceil.
 * scrollLeft can return decimals while offset are always integer
 *
 * @param {number} val - The scrollLeft value to be rounded.
 * @return {number} The rounded scrollLeft value.
 */
function roundScrollLeft( val ) {
	return Math.ceil( val );
}

/**
 * Parses the given HTML string and returns the text content of the body element.
 *
 * @param {string} html - The HTML string to parse
 * @return {string} The text content of the body element in the parsed document
 */
function extractTextFromHtml( html ) {
	tempElement.innerHTML = html;
	return tempElement.textContent;
}

/**
 * Returns the actual size (width or height) of the provided element.
 *
 * @param {Element} element - The element for which to get the size.
 * @param {string} type - The type of size to retrieve ('width' or 'height').
 * @return {number} The actual size of the element based on the specified type.
 */
function getActualSize( element, type ) {
	if ( !element || !( element instanceof Element ) || ( type !== 'width' && type !== 'height' ) ) {
		mw.log.error( '[TabberNeue] Invalid element or type provided for getActualSize' );
		return 0;
	}

	let value = element[ sizeProperties[ type ] ];

	if ( value === 0 ) {
		const clone = element.cloneNode( true );
		clone.style.position = 'absolute';
		clone.style.visibility = 'hidden';
		tempElement.appendChild( clone );
		value = clone[ sizeProperties[ type ] ];
		clone.parentNode.removeChild( clone );
	}

	return value;
}

/**
 * Updates the height of a section based on the height of the provided panel.
 *
 * @param {Element} section - The section element to update the height for.
 * @param {Element} panel - The panel element whose height will be used to
 * update the section height.
 * @return {void}
 */
function updateSectionHeight( section, panel ) {
	/* Exit early if it is not the active panel */
	if ( panel.getAttribute( 'aria-hidden' ) !== 'false' ) {
		return;
	}

	const height = getActualSize( panel, 'height' );

	window.requestAnimationFrame( function () {
		section.style.height = height + 'px';
		// Scroll to tab
		section.scrollLeft = panel.offsetLeft;
	} );
}

/**
 * Handles the resize event for an element.
 *
 * @param {Array} entries - An array of ResizeObserverEntry objects representing
 * the elements being resized.
 * @return {void}
 */
function onElementResize( entries ) {
	if ( entries && entries.length > 0 ) {
		const targetPanel = entries[ 0 ].target;
		if ( targetPanel instanceof Element ) {
			const section = targetPanel.parentNode;
			updateSectionHeight( section, targetPanel );
		}
	}
}

/**
 * Initialize Tabber
 *
 * @param {HTMLElement} tabber
 * @param {number} count
 */
function initTabber( tabber, count ) {
	const
		config = require( './config.json' ),
		header = tabber.querySelector( ':scope > .tabber__header' ),
		tabList = document.createElement( 'nav' ),
		prevButton = document.createElement( 'div' ),
		nextButton = document.createElement( 'div' ),
		indicator = document.createElement( 'div' );

	/**
	 * Function to build tabs for a tabber component.
	 * It iterates over tab panels, creates corresponding tab elements,
	 * assigns necessary attributes, and appends them to the tab list.
	 */
	const buildTabs = function () {
		const tabPanels = tabber.querySelectorAll( ':scope > .tabber__section > .tabber__panel' );
		const fragment = document.createDocumentFragment();
		const hashList = [];

		Array.prototype.forEach.call( tabPanels, function ( tabPanel ) {
			const tab = document.createElement( 'a' );
			let title = tabPanel.getAttribute( 'data-title' );

			if ( config && config.parseTabName ) {
				tab.innerHTML = title;
				title = extractTextFromHtml( title );
			} else {
				tab.textContent = title;
			}

			let hash = mw.util.escapeIdForAttribute( title ) + '-' + count;

			// add to list of already used hash
			hashList.push( hash );

			// check if the hash is already used before
			let hashCount = 0;
			hashList.forEach(
				function ( h ) {
					hashCount += ( h === hash ) ? 1 : 0;
				}
			);

			// append counter if the same hash already used
			hash += ( hashCount === 1 ) ? '' : ( '-' + hashCount );

			tabPanel.setAttribute( 'id', hash );
			tabPanel.setAttribute( 'role', 'tabpanel' );
			tabPanel.setAttribute( 'aria-labelledby', 'tab-' + hash );
			tabPanel.setAttribute( 'aria-hidden', true );

			tab.classList.add( 'tabber__tab' );
			tab.setAttribute( 'role', 'tab' );
			tab.setAttribute( 'href', '#' + hash );
			tab.setAttribute( 'id', 'tab-' + hash );
			tab.setAttribute( 'aria-selected', false );
			tab.setAttribute( 'aria-controls', hash );

			fragment.append( tab );
		} );

		tabList.append( fragment );

		tabList.classList.add( 'tabber__tabs' );
		tabList.setAttribute( 'role', 'tablist' );
		prevButton.classList.add( 'tabber__header__prev' );
		nextButton.classList.add( 'tabber__header__next' );
		indicator.classList.add( 'tabber__indicator' );

		header.append( prevButton, tabList, nextButton, indicator );
	};

	const updateIndicator = function ( showTransition ) {
		// Select the first tab when there are no active tab (e.g. page preview)
		const activeTab = tabList.querySelector( ACTIVETAB_SELECTOR ) || tabList.querySelector( '.tabber__tab' );

		const width = getActualSize( activeTab, 'width' );

		indicator.style.width = width + 'px';
		indicator.style.transform = 'translateX(' + ( activeTab.offsetLeft - roundScrollLeft( tabList.scrollLeft ) ) + 'px)';
		indicator.style.transition = '';

		// Do not animate when user prefers reduced motion
		if ( window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
			return;
		}

		if ( showTransition ) {
			indicator.style.transition = 'transform 250ms ease, width 250ms ease';
		}
	};

	let resizeObserver = null;
	if ( window.ResizeObserver ) {
		resizeObserver = new ResizeObserver( mw.util.debounce( 250, onElementResize ) );
	}

	buildTabs();
	tabber.prepend( header );

	// Initalize previous and next buttons
	const initHeaderButtons = function () {
		const updateTabsNavigation = function () {
			/* eslint-disable mediawiki/class-doc */
			const
				PREVCLASS = 'tabber__header--prev-visible',
				NEXTCLASS = 'tabber__header--next-visible';

			const isScrollable = ( tabList.scrollWidth > header.offsetWidth );

			if ( !isScrollable ) {
				header.classList.remove( NEXTCLASS );
				header.classList.remove( PREVCLASS );
				return;
			}

			const scrollLeft = roundScrollLeft( tabList.scrollLeft );

			// Scroll to the start
			if ( scrollLeft <= 0 ) {
				header.classList.remove( PREVCLASS );
				header.classList.add( NEXTCLASS );
			} else {
				// Scroll to the end
				if ( scrollLeft + tabList.offsetWidth >= tabList.scrollWidth ) {
					header.classList.remove( NEXTCLASS );
					header.classList.add( PREVCLASS );
				} else {
					header.classList.add( NEXTCLASS );
					header.classList.add( PREVCLASS );
				}
			}
			/* eslint-enable mediawiki/class-doc */
		};

		updateTabsNavigation();

		// Set up click event listener
		header.addEventListener( 'click', function ( event ) {
			// Tab button
			if ( event.target.classList.contains( 'tabber__tab' ) ) {
				const targetHash = event.target.getAttribute( 'href' ).slice( 1 );
				event.preventDefault();
				if ( !config || config.updateLocationOnTabChange ) {
					// Add hash to the end of the URL
					history.replaceState( null, null, '#' + targetHash );
				}
				showPanel( targetHash, true );
				// Handle tab navigation buttons when device uses a pointer device
			} else if ( matchMedia( '(hover: hover)' ).matches ) {
				const scrollOffset = header.offsetWidth / 2;
				const scrollTabs = function ( offset ) {
					const scrollLeft = roundScrollLeft( tabList.scrollLeft ) + offset;
					// Scroll to the start
					if ( scrollLeft <= 0 ) {
						tabList.scrollLeft = 0;
					} else {
						tabList.scrollLeft = scrollLeft;
					}
				};
				// Prev button
				if ( event.target.classList.contains( 'tabber__header__prev' ) ) {
					scrollTabs( -scrollOffset );
					// Next button
				} else if ( event.target.classList.contains( 'tabber__header__next' ) ) {
					scrollTabs( scrollOffset );
				}
			}
		} );

		// Listen for scroll event on header
		// Also triggered by side-scrolling using other means other than the buttons
		tabList.addEventListener( 'scroll', function () {
			window.requestAnimationFrame( function () {
				updateTabsNavigation();
				updateIndicator( false );
			} );
		} );

		// Add class to enable animation
		// TODO: Change default to true when Safari bug is resolved
		//
		// Safari does not scroll when scroll-behavior: smooth and overflow: hidden
		// Therefore the default is set to false now until it gets resolved
		// https://bugs.webkit.org/show_bug.cgi?id=238497
		if ( !config || config.enableAnimation ) {
			tabber.classList.add( 'tabber--animate' );
		}

		// Listen for element resize
		if ( window.ResizeObserver ) {
			const tabListResizeObserver = new ResizeObserver(
				mw.util.debounce( 250, updateTabsNavigation )
			);
			tabListResizeObserver.observe( tabList );
		}
	};

	// NOTE: Are there better ways to scope them?
	const xhr = new XMLHttpRequest();
	let currentRequest = null, nextRequest = null;

	/**
	 * Loads page contents into tab
	 *
	 * @param {HTMLElement} targetPanel
	 * @param {string} url
	 */
	function loadPage( targetPanel, url ) {
		const requestData = {
			url: url,
			targetPanel: targetPanel
		};
		if ( currentRequest ) {
			if ( currentRequest.url !== requestData.url ) {
				nextRequest = requestData;
			}
			// busy
			return;
		}
		xhr.open( 'GET', url );
		currentRequest = requestData;
		xhr.send( null );
	}

	/**
	 * Show panel based on target hash
	 *
	 * @param {string} targetHash
	 * @param {boolean} allowRemoteLoad
	 * @param {boolean} scrollIntoView
	 */
	function showPanel( targetHash, allowRemoteLoad, scrollIntoView ) {
		const
			targetPanel = document.getElementById( targetHash ),
			targetTab = document.getElementById( 'tab-' + targetHash ),
			section = targetPanel.parentNode,
			activePanel = section.querySelector( ':scope > ' + ACTIVEPANEL_SELECTOR );

		let parentPanel, parentSection;

		const loadTransclusion = function () {
			const
				loading = document.createElement( 'div' ),
				loadingIndicator = document.createElement( 'div' );

			targetPanel.setAttribute( 'aria-live', 'polite' );
			targetPanel.setAttribute( 'aria-busy', 'true' );
			loading.setAttribute( 'class', 'tabber__transclusion--loading' );
			loadingIndicator.setAttribute( 'class', 'tabber__loading-indicator' );
			loading.appendChild( loadingIndicator );
			targetPanel.textContent = '';
			targetPanel.appendChild( loading );
			loadPage( targetPanel, targetPanel.dataset.tabberLoadUrl );
		};

		if ( activePanel ) {
			// Just to be safe since there can be multiple active tabs
			// even if there shouldn't be
			const activeTabs = tabList.querySelectorAll( ACTIVETAB_SELECTOR );

			if ( activeTabs.length > 0 ) {
				Array.prototype.forEach.call( activeTabs, function ( activeTab ) {
					activeTab.setAttribute( 'aria-selected', false );
				} );
			}

			if ( resizeObserver ) {
				resizeObserver.unobserve( activePanel );
			}

			activePanel.setAttribute( 'aria-hidden', true );
		}

		// Add active class to the tab
		targetTab.setAttribute( 'aria-selected', true );
		targetPanel.setAttribute( 'aria-hidden', false );

		updateIndicator( true );

		// Lazyload transclusion if needed
		if ( allowRemoteLoad &&
			targetPanel.dataset.tabberPendingLoad &&
			targetPanel.dataset.tabberLoadUrl
		) {
			loadTransclusion();
		}

		updateSectionHeight( section, targetPanel );

		// If we're inside another tab, trigger its logic to recalc its height
		parentSection = section;
		// ResizeObserver should take care of the recursivity already
		parentPanel = parentSection.closest( ACTIVEPANEL_SELECTOR );
		/* eslint-disable-next-line no-unmodified-loop-condition */
		while ( !resizeObserver && parentPanel ) {
			parentSection = parentPanel.parentNode;
			updateSectionHeight( parentSection, parentPanel );
			parentPanel = parentSection.closest( ACTIVEPANEL_SELECTOR );
		}
		if ( resizeObserver ) {
			resizeObserver.observe( targetPanel );
		}

		// If requested, scroll the tabber into view (browser fails to do that
		// on its own as it tries to look up the anchor before we add it to the
		// DOM)
		if ( scrollIntoView ) {
			targetTab.scrollIntoView();
		}
	}

	/**
	 * Event handler for XMLHttpRequest where ends loading
	 */
	function onLoadEndPage() {
		const targetPanel = currentRequest.targetPanel;
		if ( xhr.status !== 200 ) {
			const err = document.createElement( 'div' ),
				errMsg = mw.message( 'error' ).text() + ': HTTP ' + xhr.status;

			err.setAttribute( 'class', 'tabber__transclusion--error error' );
			err.appendChild( document.createTextNode( errMsg ) );
			targetPanel.textContent = '';
			targetPanel.appendChild( err );
		} else {
			const result = JSON.parse( xhr.responseText );
			targetPanel.innerHTML = result.parse.text;
			// wikipage.content hook requires a jQuery object
			/* eslint-disable-next-line no-undef */
			mw.hook( 'wikipage.content' ).fire( $( targetPanel ) );
			delete targetPanel.dataset.tabberPendingLoad;
			delete targetPanel.dataset.tabberLoadUrl;
			targetPanel.setAttribute( 'aria-busy', 'false' );
		}

		const targetHash = targetPanel.getAttribute( 'id' ),
			section = targetPanel.parentNode,
			activePanel = section.querySelector( ':scope > ' + ACTIVEPANEL_SELECTOR );

		if ( nextRequest ) {
			currentRequest = nextRequest;
			nextRequest = null;
			xhr.open( 'GET', currentRequest.url );
			xhr.send( null );
		} else {
			currentRequest = null;
		}
		if ( activePanel ) {
			// Refresh height
			showPanel( targetHash, false );
		}
	}

	xhr.timeout = 20000;
	xhr.addEventListener( 'loadend', onLoadEndPage );

	/**
	 * Retrieve target hash and trigger show panel
	 * If no targetHash is invalid, use the first panel
	 *
	 * @param {boolean} scrollIntoView
	 */
	function switchTab( scrollIntoView ) {
		let targetHash = new mw.Uri( location.href ).fragment;

		// Switch to the first tab if no targetHash or no tab is detected and do not scroll to it
		// TODO: Remove the polyfill with CSS.escape when we are dropping IE support
		if ( !targetHash || !tabList.querySelector( '#tab-' + targetHash.replace( /[^a-zA-Z0-9-_]/g, '\\$&' ) ) ) {
			targetHash = tabList.firstElementChild.getAttribute( 'id' ).slice( 4 );
			scrollIntoView = false;
		}

		showPanel( targetHash, false, scrollIntoView );
	}

	switchTab( true );

	initHeaderButtons();

	// window.addEventListener( 'hashchange', switchTab, false );

	tabber.classList.add( 'tabber--live' );
}

/**
 * Initializes tabbers by loading icons and calling initTabber function for each tabber element.
 *
 * @param {NodeList} tabbers - List of tabber elements to initialize
 * @return {void}
 */
function initTabbers( tabbers ) {
	let count = 0;
	mw.loader.load( 'ext.tabberNeue.icons' );
	Array.prototype.forEach.call( tabbers, function ( tabber ) {
		initTabber( tabber, count );
		count++;
	} );

	const style = document.getElementById( 'tabber-style' );

	// Remove critical render styles after done
	if ( style ) {
		// IE compatiblity
		style.parentNode.removeChild( style );
	}
}

/**
 * Function to initialize tabbers on the page.
 * It selects all tabbers that are not live and calls the initTabbers function on them.
 *
 * @return {void}
 */
function main() {
	const tabbers = document.querySelectorAll( '.tabber:not(.tabber--live)' );

	if ( tabbers.length === 0 ) {
		return;
	}

	initTabbers( tabbers );
}

mw.hook( 'wikipage.content' ).add( function () {
	main();
} );

/*
 * Add hooks for Tabber when Visual Editor is used.
*/
mw.loader.using( 'ext.visualEditor.desktopArticleTarget.init', function () {
	// After saving edits
	mw.hook( 'postEdit.afterRemoval' ).add( () => {
		main();
	} );
} );
