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
			var $this = $( this ),
				key = $this.attr( 'id' ).substring( 7 ),
				tabSection = $this.children( '.tabber__section' ),
				tabPanel = tabSection.children( '.tabber__panel' ),
				nav = $( '<nav>' ).addClass( 'tabber__nav' ),
				header = $( '<header>' ).addClass( 'tabber__header' ),
				arrowLeft = $( '<div>' ).addClass( 'tabber__header__prev' ),
				arrowRight = $( '<div>' ).addClass( 'tabber__header__next' ),
				hash;

			nav.attr( 'role', 'tablist' );

			tabPanel.each( function () {
				hash = mw.util.escapeIdForAttribute( this.title ) + '-' + key;
				$( this ).attr( 'id', hash );
				$( this ).attr( 'role', 'tabpanel' );
				$( this ).attr( 'aria-labelledby', 'tab-' + hash );
				$( this ).attr( 'aria-hidden', 'true' );
				var anchor = $( '<a>' ).text( this.title ).attr( 'title', this.title );
				anchor.addClass( 'tabber__item' );
				anchor.attr( 'role', 'tab' );
				anchor.attr( 'href', '#' + hash );
				anchor.attr( 'id', 'tab-' + hash );
				anchor.attr( 'aria-controls', hash );
				anchor.appendTo( nav );
			} );

			arrowLeft.appendTo( header );
			nav.appendTo( header );
			arrowRight.appendTo( header );

			$this.prepend( header );

			/**
			 * Internal helper function for showing panel
			 * @param  {string} targetHash to show, matching only 1 tab
			 * @return {bool} true if matching tab could be shown
			 */
			function showPanel( targetHash ) {
				const targetPanel = document.getElementById( targetHash ),
					section = targetPanel.parentElement,
					currentPanel = section.querySelector( '.tabber__panel--active' );

				if ( currentPanel ) {
					// jQuery
					nav.find('.tabber__item--active').removeClass('tabber__item--active');
					currentPanel.classList.remove( 'tabber__panel--active' );
					currentPanel.setAttribute( 'aria-hidden', 'true' );
					section.style.height = currentPanel.offsetHeight + 'px';
					section.style.height = targetPanel.offsetHeight + 'px';
				} else {
					section.style.height = targetPanel.offsetHeight + 'px';
				}

				// Add active class to the tab item
				nav.find( 'a[href="#' + targetHash + '"]' ).addClass( 'tabber__item--active' );
				targetPanel.classList.add( 'tabber__panel--active' );
				targetPanel.setAttribute( 'aria-hidden', 'false' );

				// Scroll to tab
				section.scrollLeft = targetPanel.offsetLeft;
			}

			function initButtons() {
				const header = tabber.querySelector( '.tabber__header' ),
					PREVCLASS = 'tabber__header--prev-visible',
					NEXTCLASS = 'tabber__header--next-visible';

				const scrollTabs = ( offset ) => {
					const scrollLeft = tablist.scrollLeft + offset;

					// Scroll to the start
					if ( scrollLeft <= 0 ) {
						tablist.scrollLeft = 0;
						header.classList.remove( PREVCLASS );
						header.classList.add( NEXTCLASS );
					} else {
						tablist.scrollLeft = scrollLeft;
						// Scroll to the end
						if ( scrollLeft + tablist.offsetWidth >=  tablist.scrollWidth ) {
							header.classList.remove( NEXTCLASS );
							header.classList.add( PREVCLASS );
						} else {
							header.classList.add( NEXTCLASS );
							header.classList.add( PREVCLASS );
						}
					}
				}

				const setupButtons = () => {
					const isScrollable = ( tablist.scrollWidth > header.offsetWidth ) ? true : false;

					if ( isScrollable ) {
						const prevButton = header.querySelector( '.tabber__header__prev' ),
							nextButton = header.querySelector( '.tabber__header__next' ),
							scrollOffset = header.offsetWidth / 2;

						// Just to add the right classes
						scrollTabs( 0 );
						prevButton.addEventListener( "click", () => {
							scrollTabs( -scrollOffset );
						}, false );

						nextButton.addEventListener( "click", () => {
							scrollTabs( scrollOffset );
						}, false );
					} else {
						header.classList.remove( NEXTCLASS );
						header.classList.remove( PREVCLASS );
					}
				}

				setupButtons();

				// Listen for window resize
				window.addEventListener( 'resize', () => {
					mw.util.debounce( 250, setupButtons() );
				} );
			}

			function switchTab() {
				var targetHash = new mw.Uri( location.href ).fragment;

				if ( targetHash ) {
					if ( nav.find( 'a[href="#' + targetHash + '"]' ).length ) {
						showPanel( targetHash );
					}
				} else {
					showPanel( tabPanel.first().attr( 'id' ) );
				}
			}

			const tabber = document.getElementById( 'tabber-' + key ),
				tablist = tabber.querySelector( '.tabber__nav' );

			switchTab();

			// Only run if client is not a touch device
			if ( matchMedia( '(hover: hover)' ).matches ) {
				initButtons( tabber );
			}

			$( window ).on( 'hashchange', function ( event ) {
				switchTab();
			} );

			// Respond to clicks on the nav tabs
			nav.on( 'click', 'a', function ( e ) {
				var targetHash = $( this ).attr( 'href' ).substring( 1 );
				// Prevent vertical scroll while maintaining the anchor behavior
				e.preventDefault();
				// Add hash to the end of the URL
				history.pushState( null, null, '#' + targetHash );
				showPanel( targetHash );
			} );

			$this.addClass( 'tabber--live' );
		} );
	};
}( jQuery ) );

$( document ).ready( function () {
	$( '.tabber' ).tabber();
} );
