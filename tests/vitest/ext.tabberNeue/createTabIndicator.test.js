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

	function attached() {
		const ind = createTabIndicator( { tablist, document } );
		ind.attach();
		return ind;
	}

	it( 'leaves the tablist alone until attach', () => {
		createTabIndicator( { tablist, document } );
		expect( tablist.querySelector( '.tabber__indicator' ) ).toBeNull();
	} );

	it( 'attach appends a span.tabber__indicator to the tablist', () => {
		attached();
		const indicator = tablist.querySelector( ':scope > .tabber__indicator' );
		expect( indicator ).not.toBeNull();
		expect( indicator.tagName ).toBe( 'SPAN' );
	} );

	it( 'marks the indicator aria-hidden so the tablist exposes only tabs', () => {
		attached();
		const indicator = tablist.querySelector( ':scope > .tabber__indicator' );
		expect( indicator.getAttribute( 'aria-hidden' ) ).toBe( 'true' );
	} );

	it( 'update sets transform and width from the active tab geometry', () => {
		const ind = attached();
		const tab = document.createElement( 'a' );
		Object.defineProperty( tab, 'offsetLeft', { value: 120, configurable: true } );
		Object.defineProperty( tab, 'offsetWidth', { value: 80, configurable: true } );
		ind.update( tab );
		const indicator = tablist.querySelector( '.tabber__indicator' );
		expect( indicator.style.transform ).toBe( 'translateX(120px)' );
		expect( indicator.style.width ).toBe( '80px' );
	} );

	it( 'measure reads the tab geometry without touching the indicator', () => {
		const ind = attached();
		const tab = document.createElement( 'a' );
		Object.defineProperty( tab, 'offsetLeft', { value: 120, configurable: true } );
		Object.defineProperty( tab, 'offsetWidth', { value: 80, configurable: true } );
		expect( ind.measure( tab ) ).toEqual( { left: 120, width: 80 } );
		expect( tablist.querySelector( '.tabber__indicator' ).style.width ).toBe( '' );
	} );

	it( 'apply writes previously measured geometry', () => {
		const ind = attached();
		ind.apply( { left: 30, width: 40 } );
		const indicator = tablist.querySelector( '.tabber__indicator' );
		expect( indicator.style.transform ).toBe( 'translateX(30px)' );
		expect( indicator.style.width ).toBe( '40px' );
	} );

	it( 'update is a no-op when activeTab is null', () => {
		const ind = attached();
		ind.update( null );
		const indicator = tablist.querySelector( '.tabber__indicator' );
		expect( indicator.style.transform ).toBe( '' );
		expect( indicator.style.width ).toBe( '' );
	} );

	it( 'destroy removes the indicator from the tablist', () => {
		const ind = attached();
		expect( tablist.querySelector( ':scope > .tabber__indicator' ) ).not.toBeNull();
		ind.destroy();
		expect( tablist.querySelector( ':scope > .tabber__indicator' ) ).toBeNull();
	} );

	it( 'appends nothing and no-ops when disabled', () => {
		const ind = createTabIndicator( { tablist, document, enabled: false } );
		ind.attach();
		const tab = document.createElement( 'a' );
		expect( tablist.querySelector( '.tabber__indicator' ) ).toBeNull();
		expect( () => ind.update( tab ) ).not.toThrow();
		expect( () => ind.destroy() ).not.toThrow();
	} );
} );
