const createTabIndicator =
	require( '../../../modules/ext.tabberNeue/createTabIndicator.js' );

describe( 'createTabIndicator', () => {
	let tablist;

	beforeEach( () => {
		tablist = document.createElement( 'nav' );
		tablist.className = 'tabber__tabs';
		document.body.appendChild( tablist );
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'appends a span.tabber__indicator to the tablist at construction', () => {
		createTabIndicator( { tablist, document } );
		const indicator = tablist.querySelector( ':scope > .tabber__indicator' );
		expect( indicator ).not.toBeNull();
		expect( indicator.tagName ).toBe( 'SPAN' );
	} );

	it( 'update sets transform and width from the active tab geometry', () => {
		const ind = createTabIndicator( { tablist, document } );
		const tab = document.createElement( 'a' );
		Object.defineProperty( tab, 'offsetLeft', { value: 120, configurable: true } );
		Object.defineProperty( tab, 'offsetWidth', { value: 80, configurable: true } );
		ind.update( tab );
		const indicator = tablist.querySelector( '.tabber__indicator' );
		expect( indicator.style.transform ).toBe( 'translateX(120px)' );
		expect( indicator.style.width ).toBe( '80px' );
	} );

	it( 'update is a no-op when activeTab is null', () => {
		const ind = createTabIndicator( { tablist, document } );
		ind.update( null );
		const indicator = tablist.querySelector( '.tabber__indicator' );
		expect( indicator.style.transform ).toBe( '' );
		expect( indicator.style.width ).toBe( '' );
	} );

	it( 'destroy removes the indicator from the tablist', () => {
		const ind = createTabIndicator( { tablist, document } );
		expect( tablist.querySelector( ':scope > .tabber__indicator' ) ).not.toBeNull();
		ind.destroy();
		expect( tablist.querySelector( ':scope > .tabber__indicator' ) ).toBeNull();
	} );

	it( 'appends nothing and no-ops when disabled', () => {
		const ind = createTabIndicator( { tablist, document, enabled: false } );
		const tab = document.createElement( 'a' );
		expect( tablist.querySelector( '.tabber__indicator' ) ).toBeNull();
		expect( () => ind.update( tab ) ).not.toThrow();
		expect( () => ind.destroy() ).not.toThrow();
	} );
} );
