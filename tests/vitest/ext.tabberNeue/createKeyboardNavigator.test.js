const createKeyboardNavigator =
	require( '../../../modules/ext.tabberNeue/createKeyboardNavigator.js' );

describe( 'createKeyboardNavigator', () => {
	let tablist;
	let tabs;
	let onActivate;

	beforeEach( () => {
		tablist = document.createElement( 'div' );
		tabs = [ 0, 1, 2 ].map( ( i ) => {
			const t = document.createElement( 'a' );
			t.setAttribute( 'tabindex', '-1' );
			t.dataset.idx = String( i );
			tablist.appendChild( t );
			return t;
		} );
		onActivate = vi.fn();
	} );

	function press( key ) {
		const e = new KeyboardEvent( 'keydown', { key, bubbles: true, cancelable: true } );
		tablist.dispatchEvent( e );
		return e;
	}

	it( 'ArrowRight focuses next tab and calls onActivate', () => {
		createKeyboardNavigator( { tablist, tabs, onActivate } );
		const e = press( 'ArrowRight' );
		expect( e.defaultPrevented ).toBe( true );
		expect( tabs[ 1 ].getAttribute( 'tabindex' ) ).toBe( '0' );
		expect( onActivate ).toHaveBeenCalledWith( tabs[ 1 ] );
	} );

	it( 'ArrowLeft from index 0 wraps to last', () => {
		createKeyboardNavigator( { tablist, tabs, onActivate } );
		press( 'ArrowLeft' );
		expect( tabs[ 2 ].getAttribute( 'tabindex' ) ).toBe( '0' );
		expect( onActivate ).toHaveBeenCalledWith( tabs[ 2 ] );
	} );

	it( 'Home jumps to first tab', () => {
		createKeyboardNavigator( { tablist, tabs, onActivate } );
		press( 'ArrowRight' );
		press( 'ArrowRight' );
		press( 'Home' );
		expect( tabs[ 0 ].getAttribute( 'tabindex' ) ).toBe( '0' );
		expect( onActivate ).toHaveBeenLastCalledWith( tabs[ 0 ] );
	} );

	it( 'End jumps to last tab', () => {
		createKeyboardNavigator( { tablist, tabs, onActivate } );
		press( 'End' );
		expect( tabs[ 2 ].getAttribute( 'tabindex' ) ).toBe( '0' );
		expect( onActivate ).toHaveBeenLastCalledWith( tabs[ 2 ] );
	} );

	it( 'unrelated key does not preventDefault or activate', () => {
		createKeyboardNavigator( { tablist, tabs, onActivate } );
		const e = press( 'ArrowDown' );
		expect( e.defaultPrevented ).toBe( false );
		expect( onActivate ).not.toHaveBeenCalled();
	} );

	it( 'is safe to construct with zero tabs', () => {
		const empty = document.createElement( 'div' );
		const nav = createKeyboardNavigator( {
			tablist: empty, tabs: [], onActivate
		} );
		// No listener attached, so keydowns are inert. destroy() must not throw.
		expect( () => {
			const e = new KeyboardEvent( 'keydown', { key: 'ArrowRight', bubbles: true, cancelable: true } );
			empty.dispatchEvent( e );
		} ).not.toThrow();
		expect( () => nav.destroy() ).not.toThrow();
		expect( onActivate ).not.toHaveBeenCalled();
	} );

	it( 'destroy removes the listener', () => {
		const nav = createKeyboardNavigator( { tablist, tabs, onActivate } );
		nav.destroy();
		press( 'ArrowRight' );
		expect( onActivate ).not.toHaveBeenCalled();
	} );
} );
