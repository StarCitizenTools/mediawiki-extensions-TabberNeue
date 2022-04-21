/**
 * Initialize Tabber
 *
 * @param {HTMLElement} tabber
 * @param {number} count
 */
function initTabber( tabber, count ) {
	var tabPanels = tabber.querySelectorAll( ':scope > .tabber__section > .tabber__panel' );

	var config = require( './config.json' ),
		container = document.createElement( 'header' ),
		tabList = document.createElement( 'nav' ),
		prevButton = document.createElement( 'div' ),
		nextButton = document.createElement( 'div' );

	var buildTabs = function() {
		var fragment = new DocumentFragment();

		Array.prototype.forEach.call( tabPanels, function( tabPanel ) {
			var hash = mw.util.escapeIdForAttribute( tabPanel.title ) + '-' + count,
				tab = document.createElement( 'a' );

			tabPanel.setAttribute( 'id', hash );
			tabPanel.setAttribute( 'role', 'tabpanel' );
			tabPanel.setAttribute( 'aria-labelledby', 'tab-' + hash );
			tabPanel.setAttribute( 'aria-hidden', true );

			tab.innerText = tabPanel.title;
			tab.classList.add( 'tabber__tab' );
			tab.setAttribute( 'title', tabPanel.title );
			tab.setAttribute( 'role', 'tab' );
			tab.setAttribute( 'href', '#' + hash );
			tab.setAttribute( 'id', 'tab-' + hash );
			tab.setAttribute( 'aria-select', false );
			tab.setAttribute( 'aria-controls', hash );

			fragment.append( tab );
		} );

		tabList.append( fragment );

		container.classList.add( 'tabber__header' );
		tabList.classList.add( 'tabber__tabs' );
		tabList.setAttribute( 'role', 'tablist' );
		prevButton.classList.add( 'tabber__header__prev' );
		nextButton.classList.add( 'tabber__header__next' );

		container.append( prevButton, tabList, nextButton );
	};

	var updateSectionHeight = function( section, activePanel ) {
		var height = activePanel.offsetHeight;
		if ( height === 0 ) {
			// Sometimes the tab is hidden by one of its parent elements
			// and you can only get the actual height by cloning the element
			var clone = activePanel.cloneNode( true );
			// Hide the cloned element
			clone.style.cssText = 'position:absolute;visibility:hidden;';
			// Add cloned element to body
			document.body.appendChild( clone );
			// Measure the height of the clone
			height = clone.clientHeight;
			// Remove the cloned element
			clone.parentNode.removeChild( clone );
		}
		section.style.height = String( height ) + 'px';
		// Scroll to tab
		section.scrollLeft = activePanel.offsetLeft;
	};

	var onElementResize = function( entries, observer) {
		if ( entries && entries.length > 0 ) {
			var targetPanel = entries[0].target;
			var section = targetPanel.parentElement;
			updateSectionHeight( section, targetPanel );
		}
	};

	var resizeObserver = null;
	if ( window.ResizeObserver ) {
		resizeObserver = new ResizeObserver( mw.util.debounce( 250, onElementResize ) );
	}

	buildTabs();
	tabber.prepend( container );

	// Initalize previous and next buttons
	var initButtons = function() {
		var PREVCLASS = 'tabber__header--prev-visible',
			NEXTCLASS = 'tabber__header--next-visible';

		/* eslint-disable mediawiki/class-doc */
		var scrollTabs = function( offset ) {
			var scrollLeft = tabList.scrollLeft + offset;

			// Scroll to the start
			if ( scrollLeft <= 0 ) {
				tabList.scrollLeft = 0;
			} else {
				tabList.scrollLeft = scrollLeft;
			}
		};

		var updateButtons = function() {
			var scrollLeft = tabList.scrollLeft;

			// Scroll to the start
			if ( scrollLeft <= 0 ) {
				container.classList.remove( PREVCLASS );
				container.classList.add( NEXTCLASS );
			} else {
				// Scroll to the end
				if ( scrollLeft + tabList.offsetWidth >= tabList.scrollWidth ) {
					container.classList.remove( NEXTCLASS );
					container.classList.add( PREVCLASS );
				} else {
					container.classList.add( NEXTCLASS );
					container.classList.add( PREVCLASS );
				}
			}
		};

		var setupButtons = function() {
			var isScrollable = ( tabList.scrollWidth > container.offsetWidth );

			if ( isScrollable ) {
				var scrollOffset = container.offsetWidth / 2;

				// Just to add the right classes
				updateButtons();

				// Button only shows on pointer devices
				if ( matchMedia( '(hover: hover)' ).matches ) {
					prevButton.addEventListener( 'click', function() {
						scrollTabs( -scrollOffset );
					}, false );

					nextButton.addEventListener( 'click', function() {
						scrollTabs( scrollOffset );
					}, false );
				}
			} else {
				container.classList.remove( NEXTCLASS );
				container.classList.remove( PREVCLASS );
			}
		};
		/* eslint-enable mediawiki/class-doc */

		setupButtons();

		// Listen for scroll event on header
		// Also triggered by side-scrolling using other means other than the buttons
		tabList.addEventListener( 'scroll', function() {
			updateButtons();
		} );

		// Listen for element resize
		if ( window.ResizeObserver ) {
			var tabListResizeObserver = new ResizeObserver( mw.util.debounce( 250, setupButtons ) );
			tabListResizeObserver.observe( tabList );
		}
	};

	// NOTE: Are there better ways to scope them?
	var xhr = new XMLHttpRequest();
	var currentRequest = null, nextRequest = null;

	/**
	 * Loads page contents into tab
	 *
	 * @param {HTMLElement} tab panel
	 * @param {string} api URL
	 */
	function loadPage( targetPanel, url ) {
		var requestData = {
			url: url,
			targetPanel: targetPanel
		};
		if ( currentRequest ) {
			if ( currentRequest.url != requestData.url ) {
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
	 */
	function showPanel( targetHash, allowRemoteLoad ) {
		var ACTIVETABCLASS = 'tabber__tab--active',
			ACTIVEPANELCLASS = 'tabber__panel--active',
			targetPanel = document.getElementById( targetHash ),
			targetTab = document.getElementById( 'tab-' + targetHash ),
			section = targetPanel.parentElement,
			activePanel = section.querySelector( ':scope > .' + ACTIVEPANELCLASS ),
			parentPanel, parentSection;

		var loadTransclusion = function() {
			var loading = document.createElement( 'div' ),
				indicator = document.createElement( 'div' );

			targetPanel.setAttribute( 'aria-live', 'polite' );
			targetPanel.setAttribute( 'aria-busy', 'true' );
			loading.setAttribute( 'class', 'tabber__transclusion--loading' );
			indicator.setAttribute( 'class', 'tabber__loading-indicator' );
			loading.appendChild( indicator );
			targetPanel.textContent = '';
			targetPanel.appendChild( loading );
			loadPage( targetPanel, targetPanel.dataset.tabberLoadUrl );
		}

		/* eslint-disable mediawiki/class-doc */
		if ( activePanel ) {
			// Just to be safe since there can be multiple active classes
			// even if there shouldn't be
			var activeTabs = tabList.querySelectorAll( '.' + ACTIVETABCLASS );

			if ( activeTabs.length > 0 ) {
				Array.prototype.forEach.call( activeTabs, function( activeTab ) {
					activeTab.classList.remove( ACTIVETABCLASS );
					activeTab.setAttribute( 'aria-selected', false );
				} );
			}

			if ( resizeObserver ) {
				resizeObserver.unobserve( activePanel );
			}

			activePanel.classList.remove( ACTIVEPANELCLASS );
			activePanel.setAttribute( 'aria-hidden', true );
		}

		// Add active class to the tab
		targetTab.classList.add( ACTIVETABCLASS );
		targetTab.setAttribute( 'aria-selected', true );
		targetPanel.classList.add( ACTIVEPANELCLASS );
		targetPanel.setAttribute( 'aria-hidden', false );

		// Lazyload transclusion if needed
		if ( allowRemoteLoad && targetPanel.dataset.tabberPendingLoad && targetPanel.dataset.tabberLoadUrl ) {
			loadTransclusion();
		}

		updateSectionHeight( section, targetPanel );

		// If we're inside another tab, trigger its logic to recalc its height
		parentSection = section;
		// ResizeObserver should take care of the recursivity already
		while ( !resizeObserver ) {
			parentPanel = parentSection.closest( '.' + ACTIVEPANELCLASS );
			if ( !parentPanel ) {
				break;
			}
			parentSection = parentPanel.parentElement;
			updateSectionHeight( parentSection, parentPanel );
		}
		if ( resizeObserver ) {
			resizeObserver.observe( targetPanel );
		}
		/* eslint-enable mediawiki/class-doc */
	}

	/**
	 * Event handler for XMLHttpRequest where ends loading
	 */
	function onLoadEndPage() {
		var targetPanel = currentRequest.targetPanel;
		if ( xhr.status != 200 ) {
			var err = document.createElement( 'div' ),
				errMsg = mw.message( 'error' ).text() + ': HTTP ' + xhr.status;

			err.setAttribute( 'class', 'tabber__transclusion--error error' );
			err.appendChild( document.createTextNode( errMsg ) );
			targetPanel.textContent = '';
			targetPanel.appendChild( err );
		} else {
			var result = JSON.parse( xhr.responseText );
			targetPanel.innerHTML = result.parse.text;
			// wikipage.content hook requires a jQuery object
			mw.hook( 'wikipage.content' ).fire( $( targetPanel ) );
			delete targetPanel.dataset.tabberPendingLoad;
			delete targetPanel.dataset.tabberLoadUrl;
			targetPanel.setAttribute( 'aria-busy', 'false' );
		}

		var ACTIVEPANELCLASS = 'tabber__panel--active',
			targetHash = targetPanel.getAttribute( 'id' ),
			section = targetPanel.parentElement,
			activePanel = section.querySelector( ':scope > .' + ACTIVEPANELCLASS );

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
	 * @param {HTMLElement} tabber
	 */
	function switchTab() {
		var targetHash = new mw.Uri( location.href ).fragment;

		// Switch to the first tab if no targetHash or no tab is detected
		// TODO: Remove the polyfill with CSS.escape when we are dropping IE support
		if ( !targetHash || !tabList.querySelector( '#tab-' + targetHash.replace( /[^a-zA-Z0-9-_]/g, '\\$&' ) ) ) {
			targetHash = tabList.firstElementChild.getAttribute( 'id' ).substring( 4 );
		}

		showPanel( targetHash );
	}

	switchTab();

	initButtons();

	// window.addEventListener( 'hashchange', switchTab, false );

	// Respond to clicks on the nav tabs
	Array.prototype.forEach.call( tabList.children, function( tab ) {
		tab.addEventListener( 'click', function( event ) {
			var targetHash = tab.getAttribute( 'href' ).substring( 1 );
			event.preventDefault();
			if ( !config || config.updateLocationOnTabChange ) {
				// Add hash to the end of the URL
				history.replaceState( null, null, '#' + targetHash );
			}
			showPanel( targetHash, true );
		} );
	} );

	tabber.classList.add( 'tabber--live' );
}

function main() {
	var tabbers = document.querySelectorAll( '.tabber:not( .tabber--live )' );

	if ( tabbers ) {
		var count = 0;
		mw.loader.load( 'ext.tabberNeue.icons' );
		Array.prototype.forEach.call( tabbers, function( tabber ) {
			initTabber( tabber, count );
			count++;
		} );
	}
}

main();
