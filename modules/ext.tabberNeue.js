/**
 * Initialize Tabber
 *
 * @param {HTMLElement} tabber
 * @param {number} count
 */
function initTabber( tabber, count ) {
	const tabPanels = tabber.querySelectorAll( ':scope > .tabber__section > .tabber__panel' );

	const container = document.createElement( 'header' ),
		tabList = document.createElement( 'nav' ),
		prevButton = document.createElement( 'div' ),
		nextButton = document.createElement( 'div' );

	const buildTabs = () => {
		const fragment = new DocumentFragment();

		[ ...tabPanels ].forEach( ( tabPanel ) => {
			const hash = mw.util.escapeIdForAttribute( tabPanel.title ) + '-' + count,
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

	buildTabs();
	tabber.prepend( container );

	// Initalize previous and next buttons
	const initButtons = () => {
		const PREVCLASS = 'tabber__header--prev-visible',
			NEXTCLASS = 'tabber__header--next-visible';

		/* eslint-disable mediawiki/class-doc */
		const scrollTabs = ( offset ) => {
			const scrollLeft = tabList.scrollLeft + offset;

			// Scroll to the start
			if ( scrollLeft <= 0 ) {
				tabList.scrollLeft = 0;
			} else {
				tabList.scrollLeft = scrollLeft;
			}
		};

		const updateButtons = () => {
			const scrollLeft = tabList.scrollLeft;

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

		const setupButtons = () => {
			const isScrollable = ( tabList.scrollWidth > container.offsetWidth );

			if ( isScrollable ) {
				const scrollOffset = container.offsetWidth / 2;

				// Just to add the right classes
				updateButtons();
				prevButton.addEventListener( 'click', () => {
					scrollTabs( -scrollOffset );
				}, false );

				nextButton.addEventListener( 'click', () => {
					scrollTabs( scrollOffset );
				}, false );
			} else {
				container.classList.remove( NEXTCLASS );
				container.classList.remove( PREVCLASS );
			}
		};
		/* eslint-enable mediawiki/class-doc */

		setupButtons();

		// Listen for scroll event on header
		// Also triggered by side-scrolling using other means other than the buttons
		tabList.addEventListener( 'scroll', () => {
			updateButtons();
		} );

		// Listen for window resize
		window.addEventListener( 'resize', () => {
			mw.util.debounce( 250, setupButtons() );
		} );
	};

	/**
	 * Show panel based on target hash
	 *
	 * @param {string} targetHash
	 */
	function showPanel( targetHash ) {
		const ACTIVETABCLASS = 'tabber__tab--active',
			ACTIVEPANELCLASS = 'tabber__panel--active',
			targetPanel = document.getElementById( targetHash ),
			targetTab = document.getElementById( 'tab-' + targetHash ),
			section = targetPanel.parentElement,
			activePanel = section.querySelector( ':scope > .' + ACTIVEPANELCLASS );

		const getHeight = ( el ) => {
			if ( el.offsetHeight !== 0 ) {
				return el.offsetHeight;
			}

			// Sometimes the tab is hidden by one of its parent elements
			// and you can only get the actual height by cloning the element
			const clone = el.cloneNode( true );
			// Hide the cloned element
			clone.style.cssText = 'position:absolute;visibility:hidden;';
			// Add cloned element to body
			document.body.appendChild( clone );
			// Measure the height of the clone
			const height = clone.clientHeight;
			// Remove the cloned element
			clone.parentNode.removeChild( clone );
			return height;
		};

		/* eslint-disable mediawiki/class-doc */
		if ( activePanel ) {
			// Just to be safe since there can be multiple active classes
			// even if there shouldn't be
			const activeTabs = tabList.querySelectorAll( '.' + ACTIVETABCLASS );

			if ( activeTabs.length > 0 ) {
				activeTabs.forEach( ( activeTab ) => {
					activeTab.classList.remove( ACTIVETABCLASS );
					activeTab.setAttribute( 'aria-selected', false );
				} );
			}

			activePanel.classList.remove( ACTIVEPANELCLASS );
			activePanel.setAttribute( 'aria-hidden', true );
			section.style.height = getHeight( activePanel ) + 'px';
			section.style.height = getHeight( targetPanel ) + 'px';
		} else {
			section.style.height = getHeight( targetPanel ) + 'px';
		}

		// Add active class to the tab
		targetTab.classList.add( ACTIVETABCLASS );
		targetTab.setAttribute( 'aria-selected', true );
		targetPanel.classList.add( ACTIVEPANELCLASS );
		targetPanel.setAttribute( 'aria-hidden', false );

		// Scroll to tab
		section.scrollLeft = targetPanel.offsetLeft;
		/* eslint-enable mediawiki/class-doc */
	}

	/**
	 * Retrieve target hash and trigger show panel
	 * If no targetHash is invalid, use the first panel
	 *
	 * @param {HTMLElement} tabber
	 */
	function switchTab() {
		let targetHash = new mw.Uri( location.href ).fragment;

		// Switch to the first tab if no targetHash or no tab is detected
		if ( !targetHash || !document.getElementById( 'tab-' + targetHash ) ) {
			targetHash = tabList.firstElementChild.getAttribute( 'id' ).substring( 4 );
		}

		showPanel( targetHash );
	}

	switchTab();

	// Only run if client is not a touch device
	if ( matchMedia( '(hover: hover)' ).matches ) {
		initButtons();
	}

	// window.addEventListener( 'hashchange', switchTab, false );

	// Respond to clicks on the nav tabs
	[ ...tabList.children ].forEach( ( tab ) => {
		tab.addEventListener( 'click', ( event ) => {
			const targetHash = tab.getAttribute( 'href' ).substring( 1 );
			event.preventDefault();
			// Add hash to the end of the URL
			history.pushState( null, null, '#' + targetHash );
			showPanel( targetHash );
		} );
	} );

	tabber.classList.add( 'tabber--live' );
}

function main() {
	const tabbers = document.querySelectorAll( '.tabber' );

	if ( tabbers ) {
		let count = 0;
		mw.loader.load( 'ext.tabberNeue.icons' );
		tabbers.forEach( ( tabber ) => {
			initTabber( tabber, count );
			count++;
		} );
	}
}

main();
