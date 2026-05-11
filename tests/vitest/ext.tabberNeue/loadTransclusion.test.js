const loadTransclusion =
	require( '../../../modules/ext.tabberNeue/loadTransclusion.js' );

describe( 'loadTransclusion', () => {
	let panel;
	let transclusionEl;
	let api;
	let log;
	let onContentReplaced;
	let messageBox;
	let escape;

	beforeEach( () => {
		panel = document.createElement( 'div' );
		panel.id = 'tabber-panel-x';
		transclusionEl = document.createElement( 'div' );
		transclusionEl.className = 'tabber__transclusion';
		transclusionEl.dataset.mwTabberPage = 'Test_Page';
		transclusionEl.dataset.mwTabberRevision = '42';
		panel.appendChild( transclusionEl );
		api = { get: vi.fn() };
		log = { error: vi.fn() };
		onContentReplaced = vi.fn();
		messageBox = vi.fn( ( html ) => {
			const el = document.createElement( 'div' );
			el.className = 'cdx-message';
			el.innerHTML = html;
			return el;
		} );
		escape = ( s ) => String( s );
	} );

	function call( extras = {} ) {
		return loadTransclusion( {
			panel,
			api, log,
			cdnMaxAge: 60,
			onContentReplaced,
			messageBox, escape,
			loadingDelayMs: 0,
			setTimeout: ( fn ) => {
				fn();
				return 1;
			},
			clearTimeout: vi.fn(),
			...extras
		} );
	}

	it( 'replaces panel innerHTML on success and calls onContentReplaced', async () => {
		api.get.mockResolvedValue( { parse: { text: '<p>hello</p>' } } );
		await call();
		expect( panel.innerHTML ).toBe( '<p>hello</p>' );
		expect( onContentReplaced ).toHaveBeenCalledWith( panel );
	} );

	it( 'logs and renders messageBox on API error', async () => {
		api.get.mockRejectedValue( new Error( 'boom' ) );
		await call();
		expect( log.error ).toHaveBeenCalled();
		expect( messageBox ).toHaveBeenCalledWith( 'boom', 'error' );
		expect( panel.querySelector( '.cdx-message' ) ).toBeTruthy();
		expect( panel.classList.contains( 'tabber__panel--loading' ) ).toBe( false );
	} );

	it( 'logs and renders messageBox when API response has no parse.text', async () => {
		api.get.mockResolvedValue( { parse: {} } );
		await call();
		expect( log.error ).toHaveBeenCalled();
		expect( messageBox ).toHaveBeenCalled();
	} );

	it( 'removes loading class on success', async () => {
		api.get.mockResolvedValue( { parse: { text: 'x' } } );
		// Use a real setTimeout via fake timers so the loading class actually gets added.
		vi.useFakeTimers();
		const promise = loadTransclusion( {
			panel, api, log, cdnMaxAge: 60, onContentReplaced,
			messageBox, escape, loadingDelayMs: 1
		} );
		vi.advanceTimersByTime( 5 );
		expect( panel.classList.contains( 'tabber__panel--loading' ) ).toBe( true );
		vi.useRealTimers();
		await promise;
		expect( panel.classList.contains( 'tabber__panel--loading' ) ).toBe( false );
	} );

	it( 'logs an error and returns early when pageName is missing', async () => {
		transclusionEl.dataset.mwTabberPage = '';
		await call();
		expect( api.get ).not.toHaveBeenCalled();
		expect( log.error ).toHaveBeenCalled();
	} );

	it( 'returns silently when transclusion element is absent', async () => {
		const emptyPanel = document.createElement( 'div' );
		await loadTransclusion( {
			panel: emptyPanel, api, log, cdnMaxAge: 60, onContentReplaced,
			messageBox, escape, loadingDelayMs: 0,
			setTimeout: () => 1, clearTimeout: vi.fn()
		} );
		expect( api.get ).not.toHaveBeenCalled();
	} );

	it( 'sends API request with correct revision and cdn parameters', async () => {
		api.get.mockResolvedValue( { parse: { text: '' } } );
		await call();
		expect( api.get ).toHaveBeenCalledWith(
			expect.objectContaining( {
				action: 'parse',
				oldid: '42',
				maxage: 60,
				smaxage: 60
			} ),
			expect.objectContaining( { timeout: 5000 } )
		);
	} );
} );
