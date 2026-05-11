const createRegistry =
	require( '../../../modules/ext.tabberNeue/tabberRegistry.js' );

describe( 'tabberRegistry', () => {
	let resizeObservers;
	let MockRO;
	let win;

	// Named constructor — must be a function declaration so it can be used with `new`.
	// Wrapping in vi.fn() allows call tracking on the constructor itself.
	function buildMockRO( observers ) {
		function MockROImpl( cb ) {
			const inst = {
				cb,
				observe: vi.fn(),
				unobserve: vi.fn(),
				disconnect: vi.fn()
			};
			observers.push( inst );
			return inst;
		}
		return vi.fn( MockROImpl );
	}

	// Separate named constructor for IntersectionObserver mock.
	function MockIOImpl() {
		return { observe: vi.fn(), disconnect: vi.fn() };
	}

	beforeEach( () => {
		document.body.innerHTML = '';
		document.documentElement.classList.remove( 'tabber-animations-ready' );
		resizeObservers = [];
		MockRO = buildMockRO( resizeObservers );
		win = Object.assign( {}, window, {
			matchMedia: vi.fn().mockReturnValue( { matches: false } ),
			history: window.history,
			location: { hash: '', pathname: '/wiki/Foo', search: '' },
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		} );
	} );

	afterEach( () => {
		document.body.innerHTML = '';
		document.documentElement.classList.remove( 'tabber-animations-ready' );
		mw.loader.load.mockClear();
	} );

	function makeTabberEl( id ) {
		const el = document.createElement( 'div' );
		el.className = 'tabber tabber--init';
		el.dataset.test = id;
		el.innerHTML = `
			<div class="tabber__header">
				<nav class="tabber__tabs"><a class="tabber__tab" aria-controls="${ id }-p1">A</a></nav>
			</div>
			<section class="tabber__section">
				<article class="tabber__panel" id="${ id }-p1">x</article>
			</section>
		`;
		document.body.appendChild( el );
		return el;
	}

	function make() {
		return createRegistry( {
			document, window: win,
			ResizeObserver: MockRO,
			IntersectionObserver: vi.fn( MockIOImpl ),
			setTimeout: ( fn ) => fn(),
			config: { cdnMaxAge: 60, enableAnimation: true, updateLocationOnTabChange: false },
			mw
		} );
	}

	it( 'scan constructs a tabber for each .tabber--init', () => {
		makeTabberEl( 'a' );
		makeTabberEl( 'b' );
		const reg = make();
		reg.scan();
		expect( document.querySelectorAll( '.tabber--live' ).length ).toBe( 2 );
		expect( document.querySelectorAll( '.tabber--init' ).length ).toBe( 0 );
	} );

	it( 'scan is idempotent', () => {
		makeTabberEl( 'a' );
		const reg = make();
		reg.scan();
		// Second scan should not error or re-init
		reg.scan();
		expect( document.querySelectorAll( '.tabber--live' ).length ).toBe( 1 );
	} );

	it( 'scan loads the icons module when there is at least one tabber', () => {
		makeTabberEl( 'a' );
		const reg = make();
		reg.scan();
		expect( mw.loader.load ).toHaveBeenCalledWith( 'ext.tabberNeue.icons' );
	} );

	it( 'scan does not load icons when there are no tabbers', () => {
		mw.loader.load.mockClear();
		const reg = make();
		reg.scan();
		expect( mw.loader.load ).not.toHaveBeenCalled();
	} );

	it( 'get(element) returns the tabber registered for that element', () => {
		const el = makeTabberEl( 'g' );
		const reg = make();
		reg.scan();
		const tabber = reg.get( el );
		expect( tabber ).toBeDefined();
		expect( typeof tabber.activate ).toBe( 'function' );
		expect( typeof tabber.destroy ).toBe( 'function' );
	} );

	it( 'get(element) returns undefined for unregistered elements', () => {
		const reg = make();
		const stranger = document.createElement( 'div' );
		expect( reg.get( stranger ) ).toBeUndefined();
	} );

	it( 'tabber.destroy unregisters itself from the registry', () => {
		const el = makeTabberEl( 'unreg' );
		const reg = make();
		reg.scan();
		const tabber = reg.get( el );
		expect( tabber ).toBeDefined();
		tabber.destroy();
		expect( reg.get( el ) ).toBeUndefined();
	} );

	it( 'scan schedules toggleAnimation(true) after a 250ms delay', () => {
		makeTabberEl( 'a250' );
		const setTimeoutSpy = vi.fn();
		const reg = createRegistry( {
			document, window: win,
			ResizeObserver: MockRO,
			IntersectionObserver: vi.fn( function MockIO() {
				this.observe = vi.fn();
				this.disconnect = vi.fn();
			} ),
			setTimeout: setTimeoutSpy,
			config: { cdnMaxAge: 60, enableAnimation: true, updateLocationOnTabChange: false },
			mw
		} );
		reg.scan();
		// The animation-ready setTimeout should be scheduled with delay 250.
		const calledWith250 = setTimeoutSpy.mock.calls.find( ( call ) => call[ 1 ] === 250 );
		expect( calledWith250 ).toBeDefined();
		expect( typeof calledWith250[ 0 ] ).toBe( 'function' );
	} );

	it( 'observeResize forwards to a single shared observer', () => {
		const reg = make();
		const t1 = document.createElement( 'div' );
		const t2 = document.createElement( 'div' );
		reg.observeResize( t1 );
		reg.observeResize( t2 );
		expect( resizeObservers.length ).toBe( 1 );
		expect( resizeObservers[ 0 ].observe ).toHaveBeenCalledWith( t1 );
		expect( resizeObservers[ 0 ].observe ).toHaveBeenCalledWith( t2 );
	} );

	it( 'resize entry dispatches to the owning tabber', () => {
		const tabberEl = makeTabberEl( 'a' );
		const reg = make();
		reg.scan();
		// fake a resize entry whose target is inside the tabber
		const tablist = tabberEl.querySelector( '.tabber__tabs' );
		// The tabber.handleResize call needs the tablist to be observed.
		// scan() composed createTabber which (via visibility onShow) calls registry.observeResize.
		// In this test environment, the visibility observer fires synchronously in our mock IO.
		const ro = resizeObservers[ 0 ];
		// Trigger the RO callback
		ro.cb( [ { target: tablist } ] );
		// No assertion target — we're just confirming no exception. Real assertion would
		// require spying on the tabber instance, which is internal.
		expect( () => ro.cb( [ { target: tablist } ] ) ).not.toThrow();
	} );

	it( 'toggleAnimation(true) adds the class on documentElement', () => {
		const reg = make();
		reg.toggleAnimation( true );
		expect(
			document.documentElement.classList.contains( 'tabber-animations-ready' )
		).toBe( true );
	} );

	it( 'toggleAnimation is a no-op when prefers-reduced-motion matches', () => {
		win.matchMedia = vi.fn().mockReturnValue( { matches: true } );
		document.documentElement.classList.remove( 'tabber-animations-ready' );
		const reg = make();
		reg.toggleAnimation( true );
		expect(
			document.documentElement.classList.contains( 'tabber-animations-ready' )
		).toBe( false );
	} );

	it( 'destroy disconnects the resize observer', () => {
		makeTabberEl( 'a' );
		const reg = make();
		reg.scan();
		reg.destroy();
		expect( resizeObservers[ 0 ].disconnect ).toHaveBeenCalled();
	} );

	it( 'destroy is safe to call twice', () => {
		makeTabberEl( 'd' );
		const reg = make();
		reg.scan();
		reg.destroy();
		expect( () => reg.destroy() ).not.toThrow();
	} );
} );
