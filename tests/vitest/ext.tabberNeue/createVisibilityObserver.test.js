const createVisibilityObserver =
	require( '../../../modules/ext.tabberNeue/createVisibilityObserver.js' );

describe( 'createVisibilityObserver', () => {
	let observerInstance;
	let MockIO;
	let element;
	let onShow;
	let onHide;

	beforeEach( () => {
		observerInstance = null;
		MockIO = vi.fn( function MockIOImpl( cb ) {
			this.cb = cb;
			this.observe = vi.fn();
			this.disconnect = vi.fn();
			observerInstance = this;
		} );
		element = document.createElement( 'div' );
		onShow = vi.fn();
		onHide = vi.fn();
	} );

	it( 'observes the element on construction', () => {
		createVisibilityObserver( { element, IntersectionObserver: MockIO, onShow, onHide } );
		expect( observerInstance.observe ).toHaveBeenCalledWith( element );
	} );

	it( 'calls onShow when intersecting', () => {
		createVisibilityObserver( { element, IntersectionObserver: MockIO, onShow, onHide } );
		observerInstance.cb( [ { isIntersecting: true } ] );
		expect( onShow ).toHaveBeenCalled();
		expect( onHide ).not.toHaveBeenCalled();
	} );

	it( 'calls onHide when not intersecting', () => {
		createVisibilityObserver( { element, IntersectionObserver: MockIO, onShow, onHide } );
		observerInstance.cb( [ { isIntersecting: false } ] );
		expect( onHide ).toHaveBeenCalled();
		expect( onShow ).not.toHaveBeenCalled();
	} );

	it( 'destroy disconnects', () => {
		const opts = { element, IntersectionObserver: MockIO, onShow, onHide };
		const v = createVisibilityObserver( opts );
		v.destroy();
		expect( observerInstance.disconnect ).toHaveBeenCalled();
	} );
} );
