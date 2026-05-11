const createViewTransitionWrapper =
	require( '../../../modules/ext.tabberNeue/createViewTransitionWrapper.js' );

describe( 'createViewTransitionWrapper', () => {
	let section;

	beforeEach( () => {
		section = document.createElement( 'section' );
		document.body.appendChild( section );
		document.documentElement.classList.add( 'tabber-animations-ready' );
	} );

	afterEach( () => {
		document.documentElement.classList.remove( 'tabber-animations-ready' );
		document.body.innerHTML = '';
		delete document.startViewTransition;
	} );

	describe( 'canUse', () => {
		it( 'returns false when document.startViewTransition is undefined', () => {
			const w = createViewTransitionWrapper( { section, document } );
			expect( w.canUse( 'user-click', true ) ).toBe( false );
		} );

		it( 'returns false when source is panel-scroll', () => {
			document.startViewTransition = vi.fn();
			const w = createViewTransitionWrapper( { section, document } );
			expect( w.canUse( 'panel-scroll', true ) ).toBe( false );
		} );

		it( 'returns false when hasPreviousPanel is false', () => {
			document.startViewTransition = vi.fn();
			const w = createViewTransitionWrapper( { section, document } );
			expect( w.canUse( 'user-click', false ) ).toBe( false );
		} );

		it( 'returns false when tabber-animations-ready is absent', () => {
			document.startViewTransition = vi.fn();
			document.documentElement.classList.remove( 'tabber-animations-ready' );
			const w = createViewTransitionWrapper( { section, document } );
			expect( w.canUse( 'user-click', true ) ).toBe( false );
		} );

		it( 'returns true when all gates pass', () => {
			document.startViewTransition = vi.fn();
			const w = createViewTransitionWrapper( { section, document } );
			expect( w.canUse( 'user-click', true ) ).toBe( true );
		} );
	} );

	describe( 'wrap', () => {
		it( 'sets a direction-suffixed viewTransitionName and calls startViewTransition', () => {
			const startVT = vi.fn( () => ( {
				finished: new Promise( () => {} ),
				ready: Promise.resolve(),
				updateCallbackDone: Promise.resolve()
			} ) );
			document.startViewTransition = startVT;
			const cb = vi.fn();
			const w = createViewTransitionWrapper( { section, document } );
			w.wrap( cb, 'forward' );
			expect( section.style.viewTransitionName ).toBe( 'tabber-section-forward' );
			expect( startVT ).toHaveBeenCalledWith( cb );
		} );

		it( 'clears viewTransitionName after vt.finished resolves', async () => {
			document.startViewTransition = vi.fn( () => ( {
				finished: Promise.resolve(),
				ready: Promise.resolve(),
				updateCallbackDone: Promise.resolve()
			} ) );
			const w = createViewTransitionWrapper( { section, document } );
			w.wrap( () => {}, 'forward' );
			expect( section.style.viewTransitionName ).toBe( 'tabber-section-forward' );
			await Promise.resolve();
			expect( section.style.viewTransitionName ).toBe( '' );
		} );

		it( 'a cancelled wrap does not strip the name set by a later wrap', async () => {
			let count = 0;
			document.startViewTransition = vi.fn( () => {
				count += 1;
				return {
					finished: count === 1 ?
						Promise.reject( new Error( 'cancelled' ) ) :
						new Promise( () => {} ),
					ready: Promise.resolve(),
					updateCallbackDone: Promise.resolve()
				};
			} );
			const w = createViewTransitionWrapper( { section, document } );
			w.wrap( () => {}, 'forward' );
			w.wrap( () => {}, 'backward' );
			expect( section.style.viewTransitionName ).toBe( 'tabber-section-backward' );
			await Promise.resolve();
			await Promise.resolve();
			expect( section.style.viewTransitionName ).toBe( 'tabber-section-backward' );
		} );
	} );
} );
