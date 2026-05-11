const { calculateNewScrollLeft, isOverflowing, isAtStart, isAtEnd } =
	require( '../../../modules/ext.tabberNeue/overflowMath.js' );

describe( 'overflowMath', () => {
	describe( 'isOverflowing', () => {
		it( 'returns true when scrollWidth exceeds offsetWidth', () => {
			expect( isOverflowing( { scrollWidth: 200, offsetWidth: 100 } ) ).toBe( true );
		} );
		it( 'returns false when content fits', () => {
			expect( isOverflowing( { scrollWidth: 100, offsetWidth: 100 } ) ).toBe( false );
		} );
	} );

	describe( 'isAtStart', () => {
		it( 'returns true when scrollLeft is 0', () => {
			expect( isAtStart( { scrollLeft: 0 } ) ).toBe( true );
		} );
		it( 'returns true when scrollLeft is negative (rubber-band)', () => {
			expect( isAtStart( { scrollLeft: -3 } ) ).toBe( true );
		} );
		it( 'returns false when scrolled', () => {
			expect( isAtStart( { scrollLeft: 50 } ) ).toBe( false );
		} );
	} );

	describe( 'isAtEnd', () => {
		it( 'returns true when scrolled to the end', () => {
			const m = { scrollLeft: 100, offsetWidth: 100, scrollWidth: 200 };
			expect( isAtEnd( m ) ).toBe( true );
		} );
		it( 'returns false when more content is to the right', () => {
			const m = { scrollLeft: 50, offsetWidth: 100, scrollWidth: 200 };
			expect( isAtEnd( m ) ).toBe( false );
		} );
	} );

	describe( 'calculateNewScrollLeft', () => {
		const buttonWidthRatio = 0.2;

		it( 'returns null when tab is already in visible area', () => {
			const metrics = {
				scrollLeft: 0, scrollWidth: 500, offsetWidth: 300, clientWidth: 300,
				headerWidth: 300, tabLeft: 100, tabWidth: 50
			};
			expect( calculateNewScrollLeft( metrics, buttonWidthRatio ) ).toBeNull();
		} );

		it( 'scrolls left to expose tab hidden behind prev button', () => {
			const metrics = {
				scrollLeft: 100, scrollWidth: 500, offsetWidth: 300, clientWidth: 300,
				headerWidth: 300, tabLeft: 110, tabWidth: 50
			};
			// buttonWidth = 60. visibleLeft = 100 + 60 = 160. tabLeft 110 < 160.
			// returns tabLeft - buttonWidth = 110 - 60 = 50.
			expect( calculateNewScrollLeft( metrics, buttonWidthRatio ) ).toBe( 50 );
		} );

		it( 'scrolls right to expose tab hidden behind next button', () => {
			const metrics = {
				scrollLeft: 0, scrollWidth: 500, offsetWidth: 300, clientWidth: 300,
				headerWidth: 300, tabLeft: 250, tabWidth: 50
			};
			// hasNextButton = true (300 < 500). buttonWidth = 60.
			// visibleRight = 0 + 300 - 60 = 240. tabRight 300 > 240.
			// returns tabRight - clientWidth + buttonWidth = 300 - 300 + 60 = 60.
			expect( calculateNewScrollLeft( metrics, buttonWidthRatio ) ).toBe( 60 );
		} );

		it( 'does not subtract prev-button width when at the start', () => {
			const metrics = {
				scrollLeft: 0, scrollWidth: 500, offsetWidth: 300, clientWidth: 300,
				headerWidth: 300, tabLeft: 10, tabWidth: 50
			};
			// hasPrevButton = false. visibleLeft = 0. tabLeft 10 not < 0.
			// hasNextButton = true. visibleRight = 240. tabRight 60 not > 240.
			// → null
			expect( calculateNewScrollLeft( metrics, buttonWidthRatio ) ).toBeNull();
		} );
	} );
} );
