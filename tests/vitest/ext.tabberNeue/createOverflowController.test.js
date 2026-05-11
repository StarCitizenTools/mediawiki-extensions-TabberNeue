const createOverflowController =
	require( '../../../modules/ext.tabberNeue/createOverflowController.js' );

describe( 'createOverflowController', () => {
	let tablist;
	let header;

	function makeTablist( opts = {} ) {
		return {
			scrollLeft: opts.scrollLeft || 0,
			scrollWidth: opts.scrollWidth || 100,
			offsetWidth: opts.offsetWidth || 100,
			clientWidth: opts.clientWidth || 100,
			scrollTo: vi.fn()
		};
	}

	function makeHeader() {
		const el = document.createElement( 'div' );
		Object.defineProperty( el, 'offsetWidth', { value: 200, configurable: true } );
		return el;
	}

	beforeEach( () => {
		tablist = makeTablist();
		header = makeHeader();
	} );

	describe( 'update', () => {
		it( 'removes both visibility classes when not overflowing', () => {
			header.classList.add( 'tabber__header--prev-visible', 'tabber__header--next-visible' );
			tablist = makeTablist( { scrollWidth: 100, offsetWidth: 100 } );
			const ctl = createOverflowController( {
				tablist, header, animationsEnabled: false, raf: ( fn ) => fn()
			} );
			ctl.update();
			expect( header.classList.contains( 'tabber__header--prev-visible' ) ).toBe( false );
			expect( header.classList.contains( 'tabber__header--next-visible' ) ).toBe( false );
		} );

		it( 'shows next-visible when not at end', () => {
			tablist = makeTablist(
				{ scrollWidth: 500, offsetWidth: 200, clientWidth: 200, scrollLeft: 0 }
			);
			const ctl = createOverflowController( {
				tablist, header, animationsEnabled: false, raf: ( fn ) => fn()
			} );
			ctl.update();
			expect( header.classList.contains( 'tabber__header--next-visible' ) ).toBe( true );
			expect( header.classList.contains( 'tabber__header--prev-visible' ) ).toBe( false );
		} );

		it( 'shows prev-visible when scrolled away from start', () => {
			tablist = makeTablist(
				{ scrollWidth: 500, offsetWidth: 200, clientWidth: 200, scrollLeft: 100 }
			);
			const ctl = createOverflowController( {
				tablist, header, animationsEnabled: false, raf: ( fn ) => fn()
			} );
			ctl.update();
			expect( header.classList.contains( 'tabber__header--prev-visible' ) ).toBe( true );
			expect( header.classList.contains( 'tabber__header--next-visible' ) ).toBe( true );
		} );
	} );

	describe( 'scrollTabIntoView', () => {
		it( 'is a no-op when not overflowing', () => {
			tablist = makeTablist( { scrollWidth: 100, offsetWidth: 100 } );
			const ctl = createOverflowController( {
				tablist, header, animationsEnabled: false, raf: ( fn ) => fn()
			} );
			ctl.update(); // makes isOverflowing = false
			ctl.scrollTabIntoView( { offsetLeft: 0, offsetWidth: 50 } );
			expect( tablist.scrollTo ).not.toHaveBeenCalled();
		} );

		it( 'uses smooth scroll when animations enabled', () => {
			tablist = makeTablist(
				{ scrollWidth: 500, offsetWidth: 200, clientWidth: 200, scrollLeft: 0 }
			);
			const ctl = createOverflowController( {
				tablist, header, animationsEnabled: true, raf: ( fn ) => fn()
			} );
			ctl.update();
			ctl.scrollTabIntoView( { offsetLeft: 250, offsetWidth: 50 } );
			expect( tablist.scrollTo ).toHaveBeenCalledWith( { left: 140, behavior: 'smooth' } );
		} );

		it( 'writes scrollLeft directly when animations disabled', () => {
			tablist = makeTablist(
				{ scrollWidth: 500, offsetWidth: 200, clientWidth: 200, scrollLeft: 0 }
			);
			const ctl = createOverflowController( {
				tablist, header, animationsEnabled: false, raf: ( fn ) => fn()
			} );
			ctl.update();
			ctl.scrollTabIntoView( { offsetLeft: 250, offsetWidth: 50 } );
			expect( tablist.scrollLeft ).toBe( 140 );
			expect( tablist.scrollTo ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'scrollBy', () => {
		it( 'clamps below 0 to 0', () => {
			tablist = makeTablist( { scrollLeft: 50, scrollWidth: 500, offsetWidth: 200 } );
			const ctl = createOverflowController( {
				tablist, header, animationsEnabled: false, raf: ( fn ) => fn()
			} );
			ctl.scrollBy( -200 );
			expect( tablist.scrollLeft ).toBe( 0 );
		} );

		it( 'clamps above max to max', () => {
			tablist = makeTablist( { scrollLeft: 50, scrollWidth: 500, offsetWidth: 200 } );
			const ctl = createOverflowController( {
				tablist, header, animationsEnabled: false, raf: ( fn ) => fn()
			} );
			ctl.scrollBy( 1000 );
			expect( tablist.scrollLeft ).toBe( 300 ); // 500 - 200
		} );
	} );

	it( 'destroy() exists and does not throw', () => {
		const ctl = createOverflowController( {
			tablist, header, animationsEnabled: false, raf: ( fn ) => fn()
		} );
		expect( () => ctl.destroy() ).not.toThrow();
	} );
} );
