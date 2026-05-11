const createPanelTransition =
	require( '../../../modules/ext.tabberNeue/createPanelTransition.js' );

describe( 'createPanelTransition', () => {
	let prevPanel;
	let newPanel;

	beforeEach( () => {
		prevPanel = document.createElement( 'article' );
		newPanel = document.createElement( 'article' );
		Object.defineProperty( prevPanel, 'offsetLeft', { value: 0, configurable: true } );
		Object.defineProperty( newPanel, 'offsetLeft', { value: 300, configurable: true } );
		document.body.appendChild( prevPanel );
		document.body.appendChild( newPanel );
		document.documentElement.classList.add( 'tabber-animations-ready' );
	} );

	afterEach( () => {
		document.documentElement.classList.remove( 'tabber-animations-ready' );
		document.body.innerHTML = '';
	} );

	it( 'adds --entering-from-right when offsetLeft increased', () => {
		const t = createPanelTransition( { document } );
		t.trigger( newPanel, prevPanel, 'user-click' );
		expect( newPanel.classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( true );
		expect( newPanel.classList.contains( 'tabber__panel--entering-from-left' ) ).toBe( false );
	} );

	it( 'adds --entering-from-left when offsetLeft decreased', () => {
		const t = createPanelTransition( { document } );
		t.trigger( prevPanel, newPanel, 'user-click' );
		expect( prevPanel.classList.contains( 'tabber__panel--entering-from-left' ) ).toBe( true );
		expect( prevPanel.classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( false );
	} );

	it( 'skips when source is panel-scroll', () => {
		const t = createPanelTransition( { document } );
		t.trigger( newPanel, prevPanel, 'panel-scroll' );
		expect( newPanel.classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( false );
		expect( newPanel.classList.contains( 'tabber__panel--entering-from-left' ) ).toBe( false );
	} );

	it( 'skips when previousPanel is missing', () => {
		const t = createPanelTransition( { document } );
		t.trigger( newPanel, null, 'user-click' );
		expect( newPanel.classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( false );
		expect( newPanel.classList.contains( 'tabber__panel--entering-from-left' ) ).toBe( false );
	} );

	it( 'skips when tabber-animations-ready is absent', () => {
		document.documentElement.classList.remove( 'tabber-animations-ready' );
		const t = createPanelTransition( { document } );
		t.trigger( newPanel, prevPanel, 'user-click' );
		expect( newPanel.classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( false );
		expect( newPanel.classList.contains( 'tabber__panel--entering-from-left' ) ).toBe( false );
	} );

	it( 'removes the entering class on animationend', () => {
		const t = createPanelTransition( { document } );
		t.trigger( newPanel, prevPanel, 'user-click' );
		expect( newPanel.classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( true );
		newPanel.dispatchEvent( new Event( 'animationend' ) );
		expect( newPanel.classList.contains( 'tabber__panel--entering-from-right' ) ).toBe( false );
	} );
} );
