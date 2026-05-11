const createHashRouter =
	require( '../../../modules/ext.tabberNeue/createHashRouter.js' );

describe( 'createHashRouter', () => {
	let win;
	let hist;
	let doc;
	let registry;
	let tabber;

	beforeEach( () => {
		win = {
			location: { hash: '', pathname: '/wiki/Foo', search: '' },
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		};
		hist = { replaceState: vi.fn() };
		doc = document; // jsdom
		// Clear any leftover documentElement listeners from previous tests
		const newRoot = document.createElement( 'html' );
		// Use a per-test surrogate so listeners don't leak across tests
		doc = {
			documentElement: newRoot,
			getElementById: vi.fn( ( id ) => {
				const el = document.createElement( 'div' );
				el.id = id;
				const panel = document.createElement( 'div' );
				panel.classList.add( 'tabber__panel' );
				panel.classList.add( 'tabber--live' );
				panel.appendChild( el );
				// expose for assertion
				doc._lastPanel = panel;
				return el;
			} )
		};
		registry = { get: vi.fn() };
		tabber = {
			hasPanel: vi.fn().mockReturnValue( true ),
			getTabForPanel: vi.fn().mockReturnValue( 'TAB' ),
			getDefaultTab: vi.fn().mockReturnValue( 'DEFAULT_TAB' ),
			activate: vi.fn()
		};
	} );

	function make( config = { updateLocationOnTabChange: true } ) {
		return createHashRouter( { window: win, history: hist, document: doc, registry, config } );
	}

	describe( 'initialTabFor', () => {
		it( 'returns default tab when hash is empty', () => {
			const r = make();
			win.location.hash = '';
			expect( r.initialTabFor( tabber ) ).toBe( 'DEFAULT_TAB' );
		} );

		it( 'returns the mapped tab when hash matches a panel of this tabber', () => {
			win.location.hash = '#some-panel';
			tabber.hasPanel.mockReturnValue( true );
			const r = make();
			expect( r.initialTabFor( tabber ) ).toBe( 'TAB' );
			expect( tabber.getTabForPanel ).toHaveBeenCalled();
		} );

		it( 'returns default when hash matches a different tabber', () => {
			win.location.hash = '#some-panel';
			tabber.hasPanel.mockReturnValue( false );
			const r = make();
			expect( r.initialTabFor( tabber ) ).toBe( 'DEFAULT_TAB' );
		} );
	} );

	describe( 'tabber:tabchange handler', () => {
		it( 'writes hash on user-click', () => {
			make();
			// eslint-disable-next-line n/no-unsupported-features/node-builtins
			const evt = new CustomEvent( 'tabber:tabchange', {
				detail: { panelId: 'panel-1', source: 'user-click' }
			} );
			doc.documentElement.dispatchEvent( evt );
			expect( hist.replaceState ).toHaveBeenCalledWith(
				null, '', '/wiki/Foo#panel-1'
			);
		} );

		it( 'does not write hash for non-user-click sources', () => {
			make();
			for ( const source of [ 'programmatic', 'panel-scroll', 'init', 'user-keyboard', 'hash' ] ) {
				// eslint-disable-next-line n/no-unsupported-features/node-builtins
				doc.documentElement.dispatchEvent( new CustomEvent( 'tabber:tabchange', {
					detail: { panelId: 'p', source }
				} ) );
			}
			expect( hist.replaceState ).not.toHaveBeenCalled();
		} );

		it( 'respects config.updateLocationOnTabChange === false', () => {
			make( { updateLocationOnTabChange: false } );
			// eslint-disable-next-line n/no-unsupported-features/node-builtins
			doc.documentElement.dispatchEvent( new CustomEvent( 'tabber:tabchange', {
				detail: { panelId: 'p', source: 'user-click' }
			} ) );
			expect( hist.replaceState ).not.toHaveBeenCalled();
		} );

		it( 'skips if the hash already matches', () => {
			win.location.hash = '#panel-1';
			make();
			// eslint-disable-next-line n/no-unsupported-features/node-builtins
			doc.documentElement.dispatchEvent( new CustomEvent( 'tabber:tabchange', {
				detail: { panelId: 'panel-1', source: 'user-click' }
			} ) );
			expect( hist.replaceState ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'hashchange handler', () => {
		it( 'activates the matching tab via registry', () => {
			let registeredFn;
			win.addEventListener.mockImplementation( ( event, fn ) => {
				if ( event === 'hashchange' ) {
					registeredFn = fn;
				}
			} );

			// DOM ancestry: tabberEl(.tabber--live) > panel(.tabber__panel) > el#my-panel
			const tabberEl = document.createElement( 'div' );
			tabberEl.classList.add( 'tabber--live' );
			const panel = document.createElement( 'div' );
			panel.classList.add( 'tabber__panel' );
			tabberEl.appendChild( panel );
			const el = document.createElement( 'div' );
			el.id = 'my-panel';
			panel.appendChild( el );

			doc.getElementById.mockReturnValue( el );
			registry.get.mockReturnValue( tabber );

			win.location.hash = '#my-panel';
			make();
			registeredFn();

			expect( registry.get ).toHaveBeenCalledWith( tabberEl );
			expect( tabber.activate ).toHaveBeenCalledWith( 'TAB', { source: 'hash' } );
		} );

		it( 'is a no-op when hash matches no panel', () => {
			let registeredFn;
			win.addEventListener.mockImplementation( ( event, fn ) => {
				if ( event === 'hashchange' ) {
					registeredFn = fn;
				}
			} );
			doc.getElementById.mockReturnValue( null );
			win.location.hash = '#nonexistent';
			make();
			registeredFn();
			expect( tabber.activate ).not.toHaveBeenCalled();
		} );

		it( 'is a no-op when panel has no .tabber--live ancestor', () => {
			let registeredFn;
			win.addEventListener.mockImplementation( ( event, fn ) => {
				if ( event === 'hashchange' ) {
					registeredFn = fn;
				}
			} );
			// Orphan panel — no .tabber--live ancestor
			const panel = document.createElement( 'div' );
			panel.classList.add( 'tabber__panel' );
			const el = document.createElement( 'div' );
			el.id = 'orphan';
			panel.appendChild( el );

			doc.getElementById.mockReturnValue( el );
			win.location.hash = '#orphan';
			make();
			registeredFn();
			expect( registry.get ).not.toHaveBeenCalled();
			expect( tabber.activate ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'destroy', () => {
		it( 'removes the hashchange listener', () => {
			const r = make();
			r.destroy();
			expect( win.removeEventListener ).toHaveBeenCalledWith(
				'hashchange', expect.any( Function )
			);
		} );

		it( 'removes the tabber:tabchange listener from documentElement', () => {
			const removeSpy = vi.spyOn( doc.documentElement, 'removeEventListener' );
			const r = make();
			r.destroy();
			expect( removeSpy ).toHaveBeenCalledWith(
				'tabber:tabchange', expect.any( Function )
			);
		} );
	} );
} );
