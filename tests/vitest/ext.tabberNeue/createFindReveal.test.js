const createFindReveal =
	require( '../../../modules/ext.tabberNeue/createFindReveal.js' );

describe( 'createFindReveal', () => {
	let section;
	let panels;
	let onReveal;

	beforeEach( () => {
		document.body.innerHTML = '';
		section = document.createElement( 'div' );
		section.className = 'tabber__section';
		panels = [ 0, 1, 2 ].map( ( i ) => {
			const panel = document.createElement( 'div' );
			panel.className = 'tabber__panel';
			panel.id = 'p' + i;
			const text = document.createElement( 'p' );
			text.textContent = 'content ' + i;
			panel.appendChild( text );
			section.appendChild( panel );
			return panel;
		} );
		document.body.appendChild( section );
		onReveal = vi.fn();
	} );

	function make( supported = true ) {
		return createFindReveal( { section, panels, document, onReveal, supported } );
	}

	describe( 'feature probe', () => {
		it( 'detects support by whether hidden reflects the string back', () => {
			// jsdom reflects `hidden` as a boolean, so the probe must report false
			// there rather than assuming support.
			const unit = createFindReveal( { section, panels, document, onReveal } );
			const probe = document.createElement( 'div' );
			probe.hidden = 'until-found';
			expect( unit.supported ).toBe( probe.hidden === 'until-found' );
		} );

		it( 'writes no attribute when unsupported', () => {
			// A browser that does not understand the value treats it as a plain
			// boolean `hidden`, which would hide the panel with no way back.
			make( false ).sync( panels[ 0 ] );
			for ( const panel of panels ) {
				expect( panel.hasAttribute( 'hidden' ) ).toBe( false );
			}
		} );

		it( 'binds no listener when unsupported', () => {
			make( false );
			panels[ 1 ].dispatchEvent( new Event( 'beforematch', { bubbles: true } ) );
			expect( onReveal ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'sync', () => {
		it( 'hides every panel but the active one', () => {
			make().sync( panels[ 1 ] );
			expect( panels[ 0 ].getAttribute( 'hidden' ) ).toBe( 'until-found' );
			expect( panels[ 1 ].hasAttribute( 'hidden' ) ).toBe( false );
			expect( panels[ 2 ].getAttribute( 'hidden' ) ).toBe( 'until-found' );
		} );

		it( 'reveals a panel the browser already un-hid', () => {
			const unit = make();
			unit.sync( panels[ 0 ] );
			// beforematch makes the browser drop the attribute itself.
			panels[ 2 ].removeAttribute( 'hidden' );
			unit.sync( panels[ 2 ] );
			expect( panels[ 2 ].hasAttribute( 'hidden' ) ).toBe( false );
			expect( panels[ 0 ].getAttribute( 'hidden' ) ).toBe( 'until-found' );
		} );

		it( 'is idempotent', () => {
			const unit = make();
			unit.sync( panels[ 1 ] );
			unit.sync( panels[ 1 ] );
			expect( panels[ 0 ].getAttribute( 'hidden' ) ).toBe( 'until-found' );
			expect( panels[ 1 ].hasAttribute( 'hidden' ) ).toBe( false );
		} );

		it( 'hides all panels when there is no active panel', () => {
			make().sync( null );
			for ( const panel of panels ) {
				expect( panel.getAttribute( 'hidden' ) ).toBe( 'until-found' );
			}
		} );
	} );

	describe( 'beforematch', () => {
		it( 'reports the panel the browser is revealing', () => {
			make();
			panels[ 2 ].dispatchEvent( new Event( 'beforematch', { bubbles: true } ) );
			expect( onReveal ).toHaveBeenCalledWith( panels[ 2 ] );
		} );

		it( 'resolves a descendant target to its panel', () => {
			make();
			panels[ 1 ].firstChild.dispatchEvent( new Event( 'beforematch', { bubbles: true } ) );
			expect( onReveal ).toHaveBeenCalledWith( panels[ 1 ] );
		} );

		it( 'resolves a nested tabber panel to the panel this unit owns', () => {
			// The browser fires beforematch on every hidden ancestor and the event
			// bubbles, so an inner tabber's panel passes through this section too.
			// Each level must map the target to the panel it actually owns.
			const innerSection = document.createElement( 'div' );
			innerSection.className = 'tabber__section';
			const innerPanel = document.createElement( 'div' );
			innerPanel.className = 'tabber__panel';
			innerSection.appendChild( innerPanel );
			panels[ 2 ].appendChild( innerSection );
			make();
			innerPanel.dispatchEvent( new Event( 'beforematch', { bubbles: true } ) );
			expect( onReveal ).toHaveBeenCalledWith( panels[ 2 ] );
		} );

		it( 'ignores a target outside every owned panel', () => {
			const outside = document.createElement( 'p' );
			document.body.appendChild( outside );
			make();
			section.dispatchEvent( new Event( 'beforematch', { bubbles: true } ) );
			expect( onReveal ).not.toHaveBeenCalled();
		} );

		it( 'destroy stops reporting reveals', () => {
			make().destroy();
			panels[ 2 ].dispatchEvent( new Event( 'beforematch', { bubbles: true } ) );
			expect( onReveal ).not.toHaveBeenCalled();
		} );
	} );
} );
