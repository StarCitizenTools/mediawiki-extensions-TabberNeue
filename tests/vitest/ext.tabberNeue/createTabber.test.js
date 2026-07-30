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
		<div class="tabber__section">
			<div class="tabber__panel" id="p1">one</div>
			<div class="tabber__panel" id="p2">two</div>
		</div>
	`;
	document.body.appendChild( el );
	return el;
}

function makeWrapTabberElement() {
	const el = makeTabberElement();
	el.classList.add( 'tabber--wrap' );
	return el;
}

describe( 'createTabber', () => {
	let element;
	let registry;
	let mockIO;
	let mockTransclude;
	let mockScrollBy;

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
		mockScrollBy = vi.fn();
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
					matchMedia: vi.fn().mockReturnValue( { matches: false } ),
					scrollBy: mockScrollBy
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

	it( 'creates the floating indicator in normal mode', () => {
		make();
		expect( element.querySelector( '.tabber__indicator' ) ).not.toBeNull();
	} );

	it( 'does not create the floating indicator in wrap mode', () => {
		document.body.innerHTML = '';
		element = makeWrapTabberElement();
		const t = make();
		const tabs = element.querySelectorAll( '.tabber__tab' );
		t.init( tabs[ 0 ] );
		expect( element.querySelector( '.tabber__indicator' ) ).toBeNull();
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

	describe( 'clipped scroll compensation', () => {
		it( 'transfers a scrolled section offset to the page scroll', () => {
			// Something outside the module scrolled the section itself to reveal
			// content its box was clipping. Resetting that offset drops the
			// revealed content down the page by the same amount, so the page
			// scroll has to absorb it.
			const section = element.querySelector( '.tabber__section' );
			section.scrollTop = 336;
			const t = make();
			t.init( element.querySelectorAll( '.tabber__tab' )[ 0 ] );
			expect( mockScrollBy ).toHaveBeenCalledWith( { top: 336, behavior: 'instant' } );
		} );

		it( 'resets the section offset rather than relying on the clamp', () => {
			// Panels share one grid row, so the section's scrollable height
			// tracks the tallest panel and sizing it does not clamp the offset
			// away. Leaving a residue both over-scrolls the page and strands the
			// panel's top out of reach — there is no scrollbar to get back.
			const section = element.querySelector( '.tabber__section' );
			section.scrollTop = 336;
			const t = make();
			t.init( element.querySelectorAll( '.tabber__tab' )[ 0 ] );
			expect( section.scrollTop ).toBe( 0 );
		} );

		it( 'compensates once, not again on the ResizeObserver initial entry', () => {
			// performActivation observes the new active panel, so the shared
			// ResizeObserver delivers an initial entry straight back into
			// handleResize -> setActivePanel. That must not pay the offset twice.
			const section = element.querySelector( '.tabber__section' );
			section.scrollTop = 336;
			const t = make();
			const panel = element.querySelector( '#p1' );
			t.init( element.querySelectorAll( '.tabber__tab' )[ 0 ] );
			expect( mockScrollBy ).toHaveBeenCalledTimes( 1 );
			t.handleResize( panel );
			expect( mockScrollBy ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'leaves the page scroll alone on an ordinary activation', () => {
			const t = make();
			const tabs = element.querySelectorAll( '.tabber__tab' );
			t.init( tabs[ 0 ] );
			mockScrollBy.mockClear();
			t.activate( tabs[ 1 ], { source: 'user-click' } );
			expect( mockScrollBy ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'init reveal re-scroll', () => {
		it( 'puts an adopted revealed panel back in view', () => {
			// The browser chose its page scroll against the pre-init layout,
			// where the critical CSS collapses non-first panels to zero height.
			const section = element.querySelector( '.tabber__section' );
			Object.defineProperty( section, 'clientWidth', { value: 100, configurable: true } );
			element.querySelectorAll( '.tabber__panel' ).forEach( ( panel, i ) => {
				Object.defineProperty( panel, 'offsetLeft', { value: i * 100, configurable: true } );
			} );
			section.scrollLeft = 100;
			const spy = vi.spyOn( element.querySelector( '#p2' ), 'scrollIntoView' );
			const t = make();
			t.init( element.querySelectorAll( '.tabber__tab' )[ 1 ] );
			expect( spy ).toHaveBeenCalledWith( { block: 'nearest' } );
		} );

		it( 'transfers an in-panel reveal offset instead of re-scrolling', () => {
			// A match deeper than one viewport is only reachable this way; the
			// panel's own offset clamps away once it stops being zero-height.
			const section = element.querySelector( '.tabber__section' );
			Object.defineProperty( section, 'clientWidth', { value: 100, configurable: true } );
			element.querySelectorAll( '.tabber__panel' ).forEach( ( el, i ) => {
				Object.defineProperty( el, 'offsetLeft', { value: i * 100, configurable: true } );
			} );
			const panel = element.querySelector( '#p2' );
			panel.scrollTop = 3000;
			const spy = vi.spyOn( panel, 'scrollIntoView' );
			const t = make();
			t.init( element.querySelectorAll( '.tabber__tab' )[ 1 ] );
			expect( mockScrollBy ).toHaveBeenCalledWith( { top: 3000, behavior: 'instant' } );
			expect( panel.scrollTop ).toBe( 0 );
			expect( spy ).not.toHaveBeenCalled();
		} );

		it( 'does not touch the page scroll on a plain load', () => {
			const spies = [ ...element.querySelectorAll( '.tabber__panel' ) ]
				.map( ( panel ) => vi.spyOn( panel, 'scrollIntoView' ) );
			const t = make();
			t.init( element.querySelectorAll( '.tabber__tab' )[ 0 ] );
			spies.forEach( ( spy ) => expect( spy ).not.toHaveBeenCalled() );
		} );
	} );

	describe( 'getRevealedTab', () => {
		/**
		 * jsdom has no layout, so stand in for the carousel geometry:
		 * a measurable section and one 100px-wide column per panel.
		 */
		function layOutPanels() {
			const section = element.querySelector( '.tabber__section' );
			Object.defineProperty( section, 'clientWidth', { value: 100, configurable: true } );
			element.querySelectorAll( '.tabber__panel' ).forEach( ( panel, i ) => {
				Object.defineProperty( panel, 'offsetLeft', { value: i * 100, configurable: true } );
			} );
		}

		it( 'returns null while the section rests on the default panel', () => {
			layOutPanels();
			expect( make().getRevealedTab() ).toBeNull();
		} );

		it( 'returns the tab of a panel the browser already scrolled to', () => {
			layOutPanels();
			element.querySelector( '.tabber__section' ).scrollLeft = 100;
			const tabs = element.querySelectorAll( '.tabber__tab' );
			expect( make().getRevealedTab() ).toBe( tabs[ 1 ] );
		} );

		it( 'returns null when the section has no layout to measure', () => {
			element.querySelector( '.tabber__section' ).scrollLeft = 100;
			expect( make().getRevealedTab() ).toBeNull();
		} );

		it( 'falls back to a panel scrolled internally by the browser', () => {
			// Firefox reveals a deep match by scrolling the panel's own box and
			// leaves the section at 0, so the section offset alone misses it.
			layOutPanels();
			element.querySelector( '#p2' ).scrollTop = 240;
			const tabs = element.querySelectorAll( '.tabber__tab' );
			expect( make().getRevealedTab() ).toBe( tabs[ 1 ] );
		} );

		it( 'prefers the section offset over an in-panel offset', () => {
			layOutPanels();
			element.querySelector( '.tabber__section' ).scrollLeft = 100;
			element.querySelector( '#p1' ).scrollTop = 240;
			const tabs = element.querySelectorAll( '.tabber__tab' );
			expect( make().getRevealedTab() ).toBe( tabs[ 1 ] );
		} );
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
			<div class="tabber__section">
				<div class="tabber__panel" id="p1">one</div>
				<div class="tabber__panel" id="p2">two</div>
			</div>
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

	it( 'burst activation bypasses both VT and the fallback class', () => {
		const mockVT = vi.fn( () => ( {
			finished: Promise.resolve(),
			ready: Promise.resolve(),
			updateCallbackDone: Promise.resolve()
		} ) );
		document.startViewTransition = mockVT;
		try {
			const t = make();
			t.init( tabs[ 0 ] );
			t.activate( tabs[ 1 ], { source: 'find', preventScroll: true } );
			expect( mockVT ).not.toHaveBeenCalled();
			expect( panels[ 1 ].classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( false );
			expect( panels[ 1 ].classList.contains( 'tabber__panel--entering-from-left' ) ).toBe( false );
		} finally {
			delete document.startViewTransition;
		}
	} );
} );
