/**
 * This needs a full-rewrite dropping jQuery and using ES6.
 * But it will do for now.
 */
( function ( $ ) {
	$.fn.tabber = function () {
		// Load icons
		mw.loader.load( 'ext.tabberNeue.icons' );

		return this.each( function () {
			// create tabs
			const $this = $( this ),
				key = $this.attr( 'id' ).substring( 7 ),
				tabSection = $this.children( '.tabber__section' ),
				tabPanels = tabSection.children( '.tabber__panel' );

			const container = document.createElement( 'header' ),
				tablist = document.createElement( 'nav' ),
				prevButton = document.createElement( 'div' ),
				nextButton = document.createElement( 'div' );

			container.classList.add( 'tabber__header' );
			tablist.classList.add( 'tabber__nav' );
			tablist.setAttribute( 'role', 'tablist' );
			prevButton.classList.add( 'tabber__header__prev' );
			nextButton.classList.add( 'tabber__header__next' );

			[ ...tabPanels ].forEach( ( tabPanel ) => {
				const hash = mw.util.escapeIdForAttribute( tabPanel.title ) + '-' + key,
					tab = document.createElement( 'a' );

				tabPanel.setAttribute( 'id', hash );
				tabPanel.setAttribute( 'role', 'tabpanel' );
				tabPanel.setAttribute( 'aria-labelledby', 'tab-' + hash );
				tabPanel.setAttribute( 'aria-hidden', 'true' );

				tab.innerText = tabPanel.title;
				tab.classList.add( 'tabber__item' );
				tab.setAttribute( 'title', tabPanel.title );
				tab.setAttribute( 'role', 'tab' );
				tab.setAttribute( 'href', '#' + hash );
				tab.setAttribute( 'id', 'tab-' + hash );
				tab.setAttribute( 'aria-controls', hash );

				tablist.append( tab );
			} );

			container.append( prevButton, tablist, nextButton );

			$this.prepend( container );

			// Initalize previous and next buttons
			const initButtons = () => {
				const PREVCLASS = 'tabber__header--prev-visible',
					NEXTCLASS = 'tabber__header--next-visible';

				/* eslint-disable mediawiki/class-doc */
				const scrollTabs = ( offset ) => {
					const scrollLeft = tablist.scrollLeft + offset;

					// Scroll to the start
					if ( scrollLeft <= 0 ) {
						tablist.scrollLeft = 0;
						container.classList.remove( PREVCLASS );
						container.classList.add( NEXTCLASS );
					} else {
						tablist.scrollLeft = scrollLeft;
						// Scroll to the end
						if ( scrollLeft + tablist.offsetWidth >= tablist.scrollWidth ) {
							container.classList.remove( NEXTCLASS );
							container.classList.add( PREVCLASS );
						} else {
							container.classList.add( NEXTCLASS );
							container.classList.add( PREVCLASS );
						}
					}
				};

				const setupButtons = () => {
					const isScrollable = ( tablist.scrollWidth > container.offsetWidth );

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
			 * Internal helper function for showing panel
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
					const activeTab = tablist.querySelector( '.' + ACTIVETABCLASS );

					if ( activeTab ) {
						activeTab.classList.remove( ACTIVETABCLASS );
					}

					activePanel.classList.remove( ACTIVEPANELCLASS );
					activePanel.setAttribute( 'aria-hidden', 'true' );
					section.style.height = activePanel.offsetHeight + 'px';
					section.style.height = targetPanel.offsetHeight + 'px';
				} else {
					section.style.height = targetPanel.offsetHeight + 'px';
				}

				// Add active class to the tab item
				targetTab.classList.add( ACTIVETABCLASS );
				targetPanel.classList.add( ACTIVEPANELCLASS );
				targetPanel.setAttribute( 'aria-hidden', 'false' );

				// Scroll to tab
				section.scrollLeft = targetPanel.offsetLeft;
				/* eslint-enable mediawiki/class-doc */
			}

			function switchTab() {
				let targetHash = new mw.Uri( location.href ).fragment;

				// Switch to the first tab if no targetHash or no tab is detected
				if ( !targetHash || !tablist.querySelector( '#tab-' + targetHash ) ) {
					targetHash = tablist.firstElementChild.getAttribute( 'id' ).substring( 4 );
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
			[ ...tablist.children ].forEach( ( tab ) => {
				tab.addEventListener( 'click', ( event ) => {
					const targetHash = tab.getAttribute( 'href' ).substring( 1 );
					event.preventDefault();
					// Add hash to the end of the URL
					history.pushState( null, null, '#' + targetHash );
					showPanel( targetHash );
				} );
			} );

			$this.addClass( 'tabber--live' );
		} );
	};
}( jQuery ) );

$( function () {
	$( '.tabber' ).tabber();
} );
