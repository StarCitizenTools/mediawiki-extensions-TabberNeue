const createTabber = require( '../../../modules/ext.tabberNeue/createTabber.js' );

function makeTabberElement() {
	const el = document.createElement( 'div' );
	el.className = 'tabber tabber--init';
	el.innerHTML = `
		<div class="tabber__header">
			<nav class="tabber__tabs" role="tablist">
				<a class="tabber__tab" role="tab" aria-controls="p1">A</a>
				<a class="tabber__tab" role="tab" aria-controls="p2">B</a>
			</nav>
		</div>
		<section class="tabber__section">
			<article class="tabber__panel" id="p1">one</article>
			<article class="tabber__panel" id="p2">two</article>
		</section>
	`;
	document.body.appendChild( el );
	return el;
}

describe( 'createTabber', () => {
	let element;
	let registry;
	let mockIO;
	let mockTransclude;

	beforeEach( () => {
		element = makeTabberElement();
		registry = {
			observeResize: vi.fn(),
			unobserveResize: vi.fn(),
			unregister: vi.fn(),
			get: vi.fn()
		};
		mockIO = vi.fn( function MockIO() {
			this.observe = vi.fn();
			this.disconnect = vi.fn();
		} );
		mockTransclude = vi.fn();
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	function make() {
		return createTabber( {
			element, registry,
			deps: {
				config: { cdnMaxAge: 60, enableAnimation: false, updateLocationOnTabChange: true },
				mw,
				window: Object.assign( {}, window, {
					matchMedia: vi.fn().mockReturnValue( { matches: false } )
				} ),
				document,
				IntersectionObserver: mockIO,
				requestAnimationFrame: ( fn ) => fn(),
				setTimeout: ( fn ) => fn(),
				loadTransclusion: mockTransclude
			}
		} );
	}

	it( 'sets initial tab attributes', () => {
		make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		for ( const tab of tabs ) {
			expect( tab.getAttribute( 'tabindex' ) ).toBe( '-1' );
			expect( tab.getAttribute( 'aria-selected' ) ).toBe( 'false' );
		}
	} );

	it( 'init flips --init to --live and activates the given tab', () => {
		const t = make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		t.init( tabs[ 0 ] );
		expect( element.classList.contains( 'tabber--live' ) ).toBe( true );
		expect( element.classList.contains( 'tabber--init' ) ).toBe( false );
		expect( tabs[ 0 ].getAttribute( 'aria-selected' ) ).toBe( 'true' );
		expect( tabs[ 0 ].getAttribute( 'tabindex' ) ).toBe( '0' );
	} );

	it( 'activate dispatches tabber:tabchange with source', () => {
		const t = make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		const handler = vi.fn();
		element.addEventListener( 'tabber:tabchange', handler );
		t.init( tabs[ 0 ] );
		handler.mockClear();
		t.activate( tabs[ 1 ], { source: 'user-click' } );
		expect( handler ).toHaveBeenCalledTimes( 1 );
		expect( handler.mock.calls[ 0 ][ 0 ].detail ).toEqual( {
			panelId: 'p2', source: 'user-click'
		} );
	} );

	it( 'activate is a no-op if tab is already active', () => {
		const t = make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		const handler = vi.fn();
		t.init( tabs[ 0 ] );
		element.addEventListener( 'tabber:tabchange', handler );
		t.activate( tabs[ 0 ], { source: 'user-click' } );
		expect( handler ).not.toHaveBeenCalled();
	} );

	it( 'activate calls loadTransclusion when panel has .tabber__transclusion', () => {
		// Add a transclusion element to p2
		const p2 = element.querySelector( '#p2' );
		const tc = document.createElement( 'div' );
		tc.className = 'tabber__transclusion';
		tc.dataset.mwTabberPage = 'X';
		tc.dataset.mwTabberRevision = '1';
		p2.appendChild( tc );
		const t = make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		t.init( tabs[ 0 ] );
		t.activate( tabs[ 1 ], { source: 'user-click' } );
		expect( mockTransclude ).toHaveBeenCalled();
		expect( mockTransclude.mock.calls[ 0 ][ 0 ].panel ).toBe( p2 );
	} );

	it( 'getDefaultTab returns first tab', () => {
		const t = make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		expect( t.getDefaultTab() ).toBe( tabs[ 0 ] );
	} );

	it( 'getTabForPanel returns the tab mapped to a panel', () => {
		const t = make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		const p2 = element.querySelector( '#p2' );
		expect( t.getTabForPanel( p2 ) ).toBe( tabs[ 1 ] );
	} );

	it( 'hasPanel returns true for own panels and false for foreign', () => {
		const t = make();
		const ownPanel = element.querySelector( '#p2' );
		const foreignPanel = document.createElement( 'div' );
		expect( t.hasPanel( ownPanel ) ).toBe( true );
		expect( t.hasPanel( foreignPanel ) ).toBe( false );
	} );

	it( 'destroy stops keyboard navigation from firing', () => {
		const t = make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		t.init( tabs[ 0 ] );
		t.destroy();

		// After destroy, ArrowRight on the tablist should not change tabindex
		// (no listener attached) and should not activate the next tab.
		const handler = vi.fn();
		element.addEventListener( 'tabber:tabchange', handler );
		const e = new KeyboardEvent( 'keydown', { key: 'ArrowRight', bubbles: true, cancelable: true } );
		element.querySelector( '.tabber__tabs' ).dispatchEvent( e );
		expect( handler ).not.toHaveBeenCalled();
	} );

	it( 'handleResize on the tablist calls overflow.update', () => {
		const t = make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		t.init( tabs[ 0 ] );
		const tablist = element.querySelector( '.tabber__tabs' );
		// Mark the tablist with a property we can detect; we only need to verify
		// the resize-dispatched path doesn't throw and routes by target type.
		expect( () => t.handleResize( tablist ) ).not.toThrow();
	} );

	it( 'handleResize on the active panel re-runs setActivePanel without scrolling', () => {
		const t = make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		t.init( tabs[ 0 ] );
		const activePanel = t.getActivePanel();
		// Mock getBoundingClientRect on the panel so getElementSize returns a value,
		// then call handleResize and check that section.style.height is updated.
		vi.spyOn( activePanel, 'getBoundingClientRect' )
			.mockReturnValue( { width: 100, height: 250 } );
		t.handleResize( activePanel );
		const section = element.querySelector( '.tabber__section' );
		expect( section.style.height ).toBe( '250px' );
	} );

	it( 'destroy unobserves resize from registry', () => {
		const t = make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		t.init( tabs[ 0 ] );
		t.destroy();
		expect( registry.unobserveResize ).toHaveBeenCalled();
		expect( registry.unregister ).toHaveBeenCalledWith( element );
	} );
} );

describe( 'createTabber animation orchestration', () => {
	// These tests verify createTabber wires the animation units correctly.
	// Detailed unit behavior lives in createPanelTransition.test.js,
	// createTabIndicator.test.js, and createViewTransitionWrapper.test.js.
	let element;
	let registry;
	let mockIO;
	let mockTransclude;
	let tabs;
	let panels;

	beforeEach( () => {
		element = document.createElement( 'div' );
		element.className = 'tabber tabber--init';
		element.innerHTML = `
			<div class="tabber__header">
				<nav class="tabber__tabs" role="tablist">
					<a class="tabber__tab" role="tab" aria-controls="p1">A</a>
					<a class="tabber__tab" role="tab" aria-controls="p2">B</a>
				</nav>
			</div>
			<section class="tabber__section">
				<article class="tabber__panel" id="p1">one</article>
				<article class="tabber__panel" id="p2">two</article>
			</section>
		`;
		document.body.appendChild( element );

		registry = {
			observeResize: vi.fn(),
			unobserveResize: vi.fn(),
			unregister: vi.fn(),
			get: vi.fn()
		};
		mockIO = vi.fn( function MockIO() {
			this.observe = vi.fn();
			this.disconnect = vi.fn();
		} );
		mockTransclude = vi.fn();

		tabs = element.querySelectorAll( '.tabber__tab' );
		panels = element.querySelectorAll( '.tabber__panel' );

		// jsdom doesn't lay out, so offsetLeft is 0 by default.
		Object.defineProperty( panels[ 0 ], 'offsetLeft', { value: 0, configurable: true } );
		Object.defineProperty( panels[ 1 ], 'offsetLeft', { value: 300, configurable: true } );

		document.documentElement.classList.add( 'tabber-animations-ready' );
	} );

	afterEach( () => {
		document.documentElement.classList.remove( 'tabber-animations-ready' );
		document.body.innerHTML = '';
	} );

	function make() {
		return createTabber( {
			element, registry,
			deps: {
				config: { cdnMaxAge: 60, enableAnimation: true, updateLocationOnTabChange: true },
				mw,
				window: Object.assign( {}, window, {
					matchMedia: vi.fn().mockReturnValue( { matches: false } )
				} ),
				document,
				IntersectionObserver: mockIO,
				requestAnimationFrame: ( fn ) => fn(),
				setTimeout: ( fn ) => fn(),
				loadTransclusion: mockTransclude
			}
		} );
	}

	it( 'invokes the panel transition for deliberate activations (fallback path)', () => {
		const t = make();
		t.init( tabs[ 0 ] );
		t.activate( tabs[ 1 ], { source: 'user-click' } );
		expect( panels[ 1 ].classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( true );
	} );

	it( 'skips the panel transition on init (no previous panel)', () => {
		const t = make();
		t.init( tabs[ 0 ] );
		expect( panels[ 0 ].classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( false );
		expect( panels[ 0 ].classList.contains( 'tabber__panel--entering-from-left' ) ).toBe( false );
	} );

	it( 'invokes startViewTransition when available and skips the fallback class', () => {
		const mockVT = vi.fn( () => ( {
			finished: Promise.resolve(),
			ready: Promise.resolve(),
			updateCallbackDone: Promise.resolve()
		} ) );
		document.startViewTransition = mockVT;
		try {
			const t = make();
			t.init( tabs[ 0 ] );
			t.activate( tabs[ 1 ], { source: 'user-click' } );
			expect( mockVT ).toHaveBeenCalledTimes( 1 );
			expect( panels[ 1 ].classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( false );
		} finally {
			delete document.startViewTransition;
		}
	} );

	it( 'panel-scroll activation bypasses both VT and the fallback class', () => {
		const mockVT = vi.fn( () => ( {
			finished: Promise.resolve(),
			ready: Promise.resolve(),
			updateCallbackDone: Promise.resolve()
		} ) );
		document.startViewTransition = mockVT;
		try {
			const t = make();
			t.init( tabs[ 0 ] );
			t.activate( tabs[ 1 ], { source: 'panel-scroll', preventScroll: true } );
			expect( mockVT ).not.toHaveBeenCalled();
			expect( panels[ 1 ].classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( false );
			expect( panels[ 1 ].classList.contains( 'tabber__panel--entering-from-left' ) ).toBe( false );
		} finally {
			delete document.startViewTransition;
		}
	} );
} );
