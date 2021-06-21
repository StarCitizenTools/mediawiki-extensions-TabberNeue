/**
 * Initialize Tabber
 *
 * @param {HTMLElement} tabber
 */
function initTabber( tabber ) {
	const key = tabber.getAttribute( 'id' ).substring( 7 ),
		tabPanels = tabber.querySelectorAll( '.tabber__panel' );

	const container = document.createElement( 'header' ),
		tabList = document.createElement( 'nav' ),
		prevButton = document.createElement( 'div' ),
		nextButton = document.createElement( 'div' );

	const buildTabs = () => {
		const fragment = new DocumentFragment();

		[ ...tabPanels ].forEach( ( tabPanel ) => {
			const hash = mw.util.escapeIdForAttribute( tabPanel.title ) + '-' + key,
				tab = document.createElement( 'a' );

			tabPanel.setAttribute( 'id', hash );
			tabPanel.setAttribute( 'role', 'tabpanel' );
			tabPanel.setAttribute( 'aria-labelledby', 'tab-' + hash );
			tabPanel.setAttribute( 'aria-hidden', true );

			tab.innerText = tabPanel.title;
			tab.classList.add( 'tabber__item' );
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
		tabList.classList.add( 'tabber__nav' );
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
				container.classList.remove( PREVCLASS );
				container.classList.add( NEXTCLASS );
			} else {
				tabList.scrollLeft = scrollLeft;
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
				scrollTabs( 0 );
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
		const ACTIVETABCLASS = 'tabber__item--active',
			ACTIVEPANELCLASS = 'tabber__panel--active',
			targetPanel = document.getElementById( targetHash ),
			targetTab = document.getElementById( 'tab-' + targetHash ),
			section = targetPanel.parentElement,
			activePanel = section.querySelector( '.' + ACTIVEPANELCLASS );

		/* eslint-disable mediawiki/class-doc */
		if ( activePanel ) {
			const activeTab = tabList.querySelector( '.' + ACTIVETABCLASS );

			if ( activeTab ) {
				activeTab.classList.remove( ACTIVETABCLASS );
				activeTab.setAttribute( 'aria-selected', false );
			}

			activePanel.classList.remove( ACTIVEPANELCLASS );
			activePanel.setAttribute( 'aria-hidden', true );
			section.style.height = activePanel.offsetHeight + 'px';
			section.style.height = targetPanel.offsetHeight + 'px';
		} else {
			section.style.height = targetPanel.offsetHeight + 'px';
		}

		// Add active class to the tab item
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
		if ( !targetHash || !tabList.querySelector( '#tab-' + targetHash ) ) {
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
		mw.loader.load( 'ext.tabberNeue.icons' );
		tabbers.forEach( ( tabber ) => {
			initTabber( tabber );
		} );
	}
}

main();
