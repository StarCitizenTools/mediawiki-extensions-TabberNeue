const {
	getElementSize, getHiddenElementSize, roundScrollLeft, setAttributes
} = require( '../../../modules/ext.tabberNeue/domHelpers.js' );

describe( 'domHelpers', () => {
	describe( 'roundScrollLeft', () => {
		it( 'rounds up fractional pixels', () => {
			expect( roundScrollLeft( 2.3 ) ).toBe( 3 );
			expect( roundScrollLeft( 0 ) ).toBe( 0 );
			expect( roundScrollLeft( 5 ) ).toBe( 5 );
		} );
	} );

	describe( 'setAttributes', () => {
		it( 'sets each attribute on the element', () => {
			const el = document.createElement( 'div' );
			setAttributes( el, { 'data-foo': 'bar', tabindex: '0' } );
			expect( el.getAttribute( 'data-foo' ) ).toBe( 'bar' );
			expect( el.getAttribute( 'tabindex' ) ).toBe( '0' );
		} );
	} );

	describe( 'getElementSize', () => {
		afterEach( () => {
			vi.restoreAllMocks();
		} );

		it( 'returns the bounding rect dimension when non-zero', () => {
			const el = document.createElement( 'div' );
			vi.spyOn( el, 'getBoundingClientRect' )
				.mockReturnValue( { width: 120, height: 40 } );
			expect( getElementSize( el, 'width' ) ).toBe( 120 );
			expect( getElementSize( el, 'height' ) ).toBe( 40 );
		} );

		it( 'returns 0 and logs error for invalid type', () => {
			const el = document.createElement( 'div' );
			expect( getElementSize( el, 'depth' ) ).toBe( 0 );
			expect( mw.log.error ).toHaveBeenCalled();
		} );

		it( 'returns 0 and logs error when element is null', () => {
			expect( getElementSize( null, 'width' ) ).toBe( 0 );
			expect( mw.log.error ).toHaveBeenCalled();
		} );

		it( 'falls back to shadow-DOM clone when bounding rect width is 0', () => {
			const el = document.createElement( 'div' );
			// Default jsdom returns 0 for unrendered elements; mock the clone's
			// getBoundingClientRect to return a known non-zero value, so we can
			// assert getElementSize returned the *fallback* result, not 0.
			const originalCloneNode = Element.prototype.cloneNode;
			vi.spyOn( Element.prototype, 'cloneNode' ).mockImplementation( function ( deep ) {
				const clone = originalCloneNode.call( this, deep );
				vi.spyOn( clone, 'getBoundingClientRect' ).mockReturnValue( { width: 99, height: 33 } );
				return clone;
			} );
			expect( getElementSize( el, 'width' ) ).toBe( 99 );
		} );

		it( 'falls back to shadow-DOM clone when bounding rect height is 0', () => {
			const el = document.createElement( 'div' );
			const originalCloneNode = Element.prototype.cloneNode;
			vi.spyOn( Element.prototype, 'cloneNode' ).mockImplementation( function ( deep ) {
				const clone = originalCloneNode.call( this, deep );
				vi.spyOn( clone, 'getBoundingClientRect' ).mockReturnValue( { width: 99, height: 33 } );
				return clone;
			} );
			expect( getElementSize( el, 'height' ) ).toBe( 33 );
		} );
	} );

	describe( 'getHiddenElementSize', () => {
		afterEach( () => {
			vi.restoreAllMocks();
		} );

		it( 'returns the cloned element size measured in a shadow DOM', () => {
			const el = document.createElement( 'div' );
			const originalCloneNode = Element.prototype.cloneNode;
			vi.spyOn( Element.prototype, 'cloneNode' ).mockImplementation( function ( deep ) {
				const clone = originalCloneNode.call( this, deep );
				vi.spyOn( clone, 'getBoundingClientRect' ).mockReturnValue( { width: 42, height: 7 } );
				return clone;
			} );
			expect( getHiddenElementSize( el, 'width' ) ).toBe( 42 );
			expect( getHiddenElementSize( el, 'height' ) ).toBe( 7 );
		} );
	} );
} );
