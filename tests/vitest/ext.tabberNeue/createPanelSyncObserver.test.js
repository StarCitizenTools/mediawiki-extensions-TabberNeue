const createPanelSyncObserver =
	require( '../../../modules/ext.tabberNeue/createPanelSyncObserver.js' );

describe( 'createPanelSyncObserver', () => {
	let observerInstance;
	let MockIO;
	let onTabActivate;
	let panelToTabMap;
	let panels;
	let tabs;

	beforeEach( () => {
		observerInstance = null;
		MockIO = vi.fn( function MockIOImpl( cb, options ) {
			this.cb = cb;
			this.options = options;
			this.observe = vi.fn();
			this.disconnect = vi.fn();
			observerInstance = this;
		} );
		onTabActivate = vi.fn();
		panels = [ document.createElement( 'div' ), document.createElement( 'div' ) ];
		tabs = [ document.createElement( 'a' ), document.createElement( 'a' ) ];
		panelToTabMap = new WeakMap();
		panelToTabMap.set( panels[ 0 ], tabs[ 0 ] );
		panelToTabMap.set( panels[ 1 ], tabs[ 1 ] );
	} );

	function make( extras = {} ) {
		return createPanelSyncObserver( {
			section: document.createElement( 'div' ),
			panelToTabMap,
			IntersectionObserver: MockIO,
			onTabActivate,
			setTimeout: ( fn ) => {
				fn();
				return 1;
			},
			clearTimeout: vi.fn(),
			...extras
		} );
	}

	it( 'attach calls observe on each panel', () => {
		const obs = make();
		obs.attach( panels );
		expect( observerInstance.observe ).toHaveBeenCalledWith( panels[ 0 ] );
		expect( observerInstance.observe ).toHaveBeenCalledWith( panels[ 1 ] );
	} );

	it( 'invokes onTabActivate when a panel becomes visible', () => {
		const obs = make();
		obs.attach( panels );
		observerInstance.cb( [ { target: panels[ 1 ], isIntersecting: true } ] );
		expect( onTabActivate ).toHaveBeenCalledWith( tabs[ 1 ] );
	} );

	it( 'ignores entries when not intersecting', () => {
		const obs = make();
		obs.attach( panels );
		observerInstance.cb( [ { target: panels[ 1 ], isIntersecting: false } ] );
		expect( onTabActivate ).not.toHaveBeenCalled();
	} );

	it( 'pauseDuring suppresses intersections fired during fn', () => {
		// Replace setTimeout so the resume is deferred until we say so.
		let resumeFn = null;
		const obs = make( {
			setTimeout: ( fn ) => {
				resumeFn = fn;
				return 42;
			}
		} );
		obs.attach( panels );
		obs.pauseDuring( () => {
			observerInstance.cb( [ { target: panels[ 1 ], isIntersecting: true } ] );
		} );
		expect( onTabActivate ).not.toHaveBeenCalled();
		// After resume, intersections fire again
		resumeFn();
		observerInstance.cb( [ { target: panels[ 1 ], isIntersecting: true } ] );
		expect( onTabActivate ).toHaveBeenCalledWith( tabs[ 1 ] );
	} );

	it( 'detach disconnects', () => {
		const obs = make();
		obs.attach( panels );
		obs.detach();
		expect( observerInstance.disconnect ).toHaveBeenCalled();
	} );

	it( 'destroy disconnects and clears pending timeout', () => {
		const clearTimeout = vi.fn();
		const obs = make( {
			setTimeout: () => 99,
			clearTimeout
		} );
		obs.attach( panels );
		obs.pauseDuring( () => {} );
		obs.destroy();
		expect( observerInstance.disconnect ).toHaveBeenCalled();
		expect( clearTimeout ).toHaveBeenCalledWith( 99 );
	} );

	it( 'uses threshold 0.5 and the section as root', () => {
		make().attach( panels );
		expect( observerInstance.options.threshold ).toBe( 0.5 );
		expect( observerInstance.options.root ).toBeInstanceOf( HTMLDivElement );
	} );
} );
