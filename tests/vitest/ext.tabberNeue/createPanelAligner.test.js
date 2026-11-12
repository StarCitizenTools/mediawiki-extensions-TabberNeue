const createPanelAligner = require( '../../../modules/ext.tabberNeue/createPanelAligner.js' );

describe( 'createPanelAligner', () => {
	let observerInstance;
	let MockIO;
	let section;
	let panels;

	beforeEach( () => {
		observerInstance = null;
		MockIO = vi.fn( function MockIOImpl( cb, options ) {
			this.cb = cb;
			this.options = options;
			this.observe = vi.fn();
			this.unobserve = vi.fn();
			this.disconnect = vi.fn();
			observerInstance = this;
		} );
		section = document.createElement( 'div' );
		panels = [ 0, 1, 2 ].map( ( i ) => {
			const panel = document.createElement( 'div' );
			Object.defineProperty( panel, 'offsetLeft', { value: i * 100, configurable: true } );
			section.appendChild( panel );
			return panel;
		} );
	} );

	function make() {
		return createPanelAligner( { section, IntersectionObserver: MockIO } );
	}

	function report( target, isIntersecting, intersectionRatio ) {
		observerInstance.cb( [ { target, isIntersecting, intersectionRatio } ] );
	}

	it( 'observes against the section, not the viewport', () => {
		make();
		expect( observerInstance.options.root ).toBe( section );
	} );

	it( 'swaps the observed panel on track', () => {
		const a = make();
		a.track( panels[ 1 ] );
		expect( observerInstance.observe ).toHaveBeenCalledWith( panels[ 1 ] );
		a.track( panels[ 2 ] );
		expect( observerInstance.unobserve ).toHaveBeenCalledWith( panels[ 1 ] );
		expect( observerInstance.observe ).toHaveBeenCalledWith( panels[ 2 ] );
	} );

	it( 'does not re-observe the panel it already tracks', () => {
		const a = make();
		a.track( panels[ 1 ] );
		a.track( panels[ 1 ] );
		expect( observerInstance.observe ).toHaveBeenCalledTimes( 1 );
		expect( observerInstance.unobserve ).not.toHaveBeenCalled();
	} );

	it( 'stops observing on track( null )', () => {
		const a = make();
		a.track( panels[ 1 ] );
		a.track( null );
		expect( observerInstance.unobserve ).toHaveBeenCalledWith( panels[ 1 ] );
	} );

	it( 'scrolls back when the tracked panel leaves the section', () => {
		const a = make();
		a.track( panels[ 2 ] );
		section.scrollLeft = 0;
		report( panels[ 2 ], false, 0 );
		expect( section.scrollLeft ).toBe( 200 );
	} );

	it( 'scrolls back when only an edge of the tracked panel touches the section', () => {
		// Edge-adjacent panels report isIntersecting true at ratio 0.
		const a = make();
		a.track( panels[ 1 ] );
		section.scrollLeft = 0;
		report( panels[ 1 ], true, 0 );
		expect( section.scrollLeft ).toBe( 100 );
	} );

	it( 'leaves the section alone while the tracked panel is mostly in view', () => {
		const a = make();
		a.track( panels[ 1 ] );
		section.scrollLeft = 100;
		const spy = vi.spyOn( section, 'scrollLeft', 'set' );
		report( panels[ 1 ], true, 0.9 );
		expect( spy ).not.toHaveBeenCalled();
	} );

	it( 'ignores an entry that arrives after its panel was untracked', () => {
		// unobserve() does not drop records the observer has already queued.
		const a = make();
		a.track( panels[ 1 ] );
		a.track( null );
		expect( () => report( panels[ 1 ], false, 0 ) ).not.toThrow();
		expect( section.scrollLeft ).toBe( 0 );
	} );

	it( 'destroy disconnects', () => {
		const a = make();
		a.destroy();
		expect( observerInstance.disconnect ).toHaveBeenCalled();
	} );
} );
