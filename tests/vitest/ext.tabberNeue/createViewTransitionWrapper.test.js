const createViewTransitionWrapper =
	require( '../../../modules/ext.tabberNeue/createViewTransitionWrapper.js' );

describe( 'createViewTransitionWrapper', () => {
	let section;

	beforeEach( () => {
		section = document.createElement( 'div' );
		document.body.appendChild( section );
		document.documentElement.classList.add( 'tabber-animations-ready' );
	} );

	afterEach( () => {
		document.documentElement.classList.remove( 'tabber-animations-ready' );
		document.body.innerHTML = '';
		delete document.startViewTransition;
	} );

	describe( 'canUse', () => {
		it( 'returns false when the element-scoped API is unavailable', () => {
			const w = createViewTransitionWrapper( { section, document } );
			expect( w.canUse( 'user-click', true ) ).toBe( false );
		} );

		it( 'returns false when only the document-scoped API exists', () => {
			document.startViewTransition = vi.fn();
			const w = createViewTransitionWrapper( { section, document } );
			expect( w.canUse( 'user-click', true ) ).toBe( false );
		} );

		it( 'returns false for a burst source', () => {
			section.startViewTransition = vi.fn();
			const w = createViewTransitionWrapper( { section, document } );
			expect( w.canUse( 'find', true ) ).toBe( false );
		} );

		it( 'returns false when hasPreviousPanel is false', () => {
			section.startViewTransition = vi.fn();
			const w = createViewTransitionWrapper( { section, document } );
			expect( w.canUse( 'user-click', false ) ).toBe( false );
		} );

		it( 'returns false when tabber-animations-ready is absent', () => {
			section.startViewTransition = vi.fn();
			document.documentElement.classList.remove( 'tabber-animations-ready' );
			const w = createViewTransitionWrapper( { section, document } );
			expect( w.canUse( 'user-click', true ) ).toBe( false );
		} );

		it( 'returns true when all gates pass', () => {
			section.startViewTransition = vi.fn();
			const w = createViewTransitionWrapper( { section, document } );
			expect( w.canUse( 'user-click', true ) ).toBe( true );
		} );
	} );

	describe( 'wrap', () => {
		it( 'sets a direction-suffixed viewTransitionName and scopes the transition to the section', () => {
			const startVT = vi.fn( () => ( {
				finished: new Promise( () => {} ),
				ready: Promise.resolve(),
				updateCallbackDone: Promise.resolve()
			} ) );
			section.startViewTransition = startVT;
			document.startViewTransition = vi.fn();
			const cb = vi.fn();
			const w = createViewTransitionWrapper( { section, document } );
			w.wrap( cb, 'forward' );
			expect( section.style.viewTransitionName ).toBe( 'tabber-section-forward' );
			expect( startVT ).toHaveBeenCalledWith( cb );
			expect( document.startViewTransition ).not.toHaveBeenCalled();
		} );

		it( 'clears viewTransitionName after vt.finished resolves', async () => {
			section.startViewTransition = vi.fn( () => ( {
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

		it( 'clears viewTransitionName when the transition is skipped', async () => {
			section.startViewTransition = vi.fn( () => ( {
				finished: Promise.reject( new Error( 'skipped' ) ),
				ready: Promise.resolve(),
				updateCallbackDone: Promise.resolve()
			} ) );
			const w = createViewTransitionWrapper( { section, document } );
			w.wrap( () => {}, 'forward' );
			await Promise.resolve();
			await Promise.resolve();
			expect( section.style.viewTransitionName ).toBe( '' );
		} );

		it( 'swallows the ready rejection a superseded transition produces', async () => {
			section.startViewTransition = vi.fn( () => ( {
				finished: new Promise( () => {} ),
				ready: Promise.reject( new Error( 'Transition was skipped' ) ),
				updateCallbackDone: Promise.resolve()
			} ) );
			const w = createViewTransitionWrapper( { section, document } );
			w.wrap( () => {}, 'forward' );
			// An unhandled rejection here fails the run.
			await new Promise( ( resolve ) => {
				setTimeout( resolve, 0 );
			} );
			expect( section.style.viewTransitionName ).toBe( 'tabber-section-forward' );
		} );

		it( 'a cancelled wrap does not strip the name set by a later wrap', async () => {
			let count = 0;
			section.startViewTransition = vi.fn( () => {
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
