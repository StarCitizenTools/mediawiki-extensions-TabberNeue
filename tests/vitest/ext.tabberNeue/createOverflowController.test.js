const createOverflowController =
	require( '../../../modules/ext.tabberNeue/createOverflowController.js' );

describe( 'createOverflowController', () => {
	let tablist;
	let header;

	function makeTablist( opts = {} ) {
		return {
			scrollLeft: opts.scrollLeft || 0,
			scrollWidth: opts.scrollWidth || 100,
			clientWidth: opts.clientWidth || 100,
			scrollTo: vi.fn()
		};
	}

	function makeHeader() {
		const el = document.createElement( 'div' );
		Object.defineProperty( el, 'offsetWidth', { value: 200, configurable: true } );
		return el;
	}

	function make( opts = {} ) {
		return createOverflowController( Object.assign( {
			tablist, header, animationsEnabled: false, raf: ( fn ) => fn()
		}, opts ) );
	}

	beforeEach( () => {
		tablist = makeTablist();
		header = makeHeader();
	} );

	describe( 'update', () => {
		it( 'removes both visibility classes when not overflowing', () => {
			header.classList.add( 'tabber__header--prev-visible', 'tabber__header--next-visible' );
			tablist = makeTablist( { scrollWidth: 100, clientWidth: 100 } );
			make().update();
			expect( header.classList.contains( 'tabber__header--prev-visible' ) ).toBe( false );
			expect( header.classList.contains( 'tabber__header--next-visible' ) ).toBe( false );
		} );

		it( 'shows next-visible when not at end', () => {
			tablist = makeTablist( { scrollWidth: 500, clientWidth: 200, scrollLeft: 0 } );
			make().update();
			expect( header.classList.contains( 'tabber__header--next-visible' ) ).toBe( true );
			expect( header.classList.contains( 'tabber__header--prev-visible' ) ).toBe( false );
		} );

		it( 'never shows arrows when disabled, even with overflow metrics (wrap mode)', () => {
			// A single over-wide tab makes scrollWidth > clientWidth even in wrap
			// mode; the disabled controller must not surface the arrows/masks.
			header.classList.add( 'tabber__header--next-visible' );
			tablist = makeTablist( { scrollWidth: 500, clientWidth: 200, scrollLeft: 0 } );
			const ctl = make( { enabled: false } );
			ctl.update();
			expect( header.classList.contains( 'tabber__header--next-visible' ) ).toBe( false );
			expect( header.classList.contains( 'tabber__header--prev-visible' ) ).toBe( false );
			expect( ctl.isOverflowing() ).toBe( false );
		} );

		it( 'shows prev-visible when scrolled away from start', () => {
			tablist = makeTablist( { scrollWidth: 500, clientWidth: 200, scrollLeft: 100 } );
			make().update();
			expect( header.classList.contains( 'tabber__header--prev-visible' ) ).toBe( true );
			expect( header.classList.contains( 'tabber__header--next-visible' ) ).toBe( true );
		} );

		describe( 'rtl', () => {
			// RTL scrollLeft runs [ -( scrollWidth - clientWidth ), 0 ], resting at 0.
			it( 'shows only next-visible at the start', () => {
				tablist = makeTablist( { scrollWidth: 500, clientWidth: 200, scrollLeft: 0 } );
				make( { rtl: true } ).update();
				expect( header.classList.contains( 'tabber__header--next-visible' ) ).toBe( true );
				expect( header.classList.contains( 'tabber__header--prev-visible' ) ).toBe( false );
			} );

			it( 'shows both when scrolled away from start', () => {
				tablist = makeTablist( { scrollWidth: 500, clientWidth: 200, scrollLeft: -100 } );
				make( { rtl: true } ).update();
				expect( header.classList.contains( 'tabber__header--prev-visible' ) ).toBe( true );
				expect( header.classList.contains( 'tabber__header--next-visible' ) ).toBe( true );
			} );

			it( 'shows only prev-visible at the end', () => {
				tablist = makeTablist( { scrollWidth: 500, clientWidth: 200, scrollLeft: -300 } );
				make( { rtl: true } ).update();
				expect( header.classList.contains( 'tabber__header--prev-visible' ) ).toBe( true );
				expect( header.classList.contains( 'tabber__header--next-visible' ) ).toBe( false );
			} );
		} );
	} );

	describe( 'scrollTabIntoView', () => {
		it( 'is a no-op when not overflowing', () => {
			tablist = makeTablist( { scrollWidth: 100, clientWidth: 100 } );
			const ctl = make( { arrowWidth: 40 } );
			ctl.update(); // makes isOverflowing = false
			ctl.scrollTabIntoView( { offsetLeft: 0, offsetWidth: 50 } );
			expect( tablist.scrollTo ).not.toHaveBeenCalled();
		} );

		it( 'uses smooth scroll when animations enabled', () => {
			tablist = makeTablist( { scrollWidth: 500, clientWidth: 200, scrollLeft: 0 } );
			const ctl = make( { animationsEnabled: true, arrowWidth: 40 } );
			ctl.update();
			ctl.scrollTabIntoView( { offsetLeft: 250, offsetWidth: 50 } );
			expect( tablist.scrollTo ).toHaveBeenCalledWith( { left: 140, behavior: 'smooth' } );
		} );

		it( 'writes scrollLeft directly when animations disabled', () => {
			tablist = makeTablist( { scrollWidth: 500, clientWidth: 200, scrollLeft: 0 } );
			const ctl = make( { arrowWidth: 40 } );
			ctl.update();
			ctl.scrollTabIntoView( { offsetLeft: 250, offsetWidth: 50 } );
			expect( tablist.scrollLeft ).toBe( 140 );
			expect( tablist.scrollTo ).not.toHaveBeenCalled();
		} );

		it( 'mirrors the tab offset and the written scrollLeft in rtl', () => {
			// The rtl mirror of offsetLeft 250 / width 50 in a 200-wide viewport is
			// tabStart = 200 - ( -100 ) - 50 = 250, the same distance as ltr above,
			// so the same 140 comes back out — negated on write.
			tablist = makeTablist( { scrollWidth: 500, clientWidth: 200, scrollLeft: 0 } );
			const ctl = make( { rtl: true, arrowWidth: 40 } );
			ctl.update();
			ctl.scrollTabIntoView( { offsetLeft: -100, offsetWidth: 50 } );
			expect( tablist.scrollLeft ).toBe( -140 );
		} );
	} );

	describe( 'scrollBy', () => {
		it( 'clamps below the start to 0', () => {
			tablist = makeTablist( { scrollLeft: 50, scrollWidth: 500, clientWidth: 200 } );
			make().scrollBy( -200 );
			expect( tablist.scrollLeft ).toBe( 0 );
		} );

		it( 'clamps beyond the end to max', () => {
			tablist = makeTablist( { scrollLeft: 50, scrollWidth: 500, clientWidth: 200 } );
			make().scrollBy( 1000 );
			expect( tablist.scrollLeft ).toBe( 300 ); // 500 - 200
		} );

		describe( 'rtl', () => {
			it( 'travels toward the end on a positive offset', () => {
				tablist = makeTablist( { scrollLeft: -50, scrollWidth: 500, clientWidth: 200 } );
				make( { rtl: true } ).scrollBy( 100 );
				expect( tablist.scrollLeft ).toBe( -150 );
			} );

			it( 'clamps below the start to 0 without producing -0', () => {
				tablist = makeTablist( { scrollLeft: -50, scrollWidth: 500, clientWidth: 200 } );
				make( { rtl: true } ).scrollBy( -200 );
				expect( tablist.scrollLeft ).toBe( 0 );
				expect( Object.is( tablist.scrollLeft, -0 ) ).toBe( false );
			} );

			it( 'clamps beyond the end to negative max', () => {
				tablist = makeTablist( { scrollLeft: -50, scrollWidth: 500, clientWidth: 200 } );
				make( { rtl: true } ).scrollBy( 1000 );
				expect( tablist.scrollLeft ).toBe( -300 );
			} );
		} );
	} );

	it( 'destroy() exists and does not throw', () => {
		expect( () => make().destroy() ).not.toThrow();
	} );
} );
