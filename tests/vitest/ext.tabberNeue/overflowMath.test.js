const { calculateNewScrollDistance, isOverflowing, isAtStart, isAtEnd } =
	require( '../../../modules/ext.tabberNeue/overflowMath.js' );

describe( 'overflowMath', () => {
	describe( 'isOverflowing', () => {
		it( 'returns true when scrollWidth exceeds clientWidth', () => {
			expect( isOverflowing( { scrollWidth: 200, clientWidth: 100 } ) ).toBe( true );
		} );
		it( 'returns false when content fits', () => {
			expect( isOverflowing( { scrollWidth: 100, clientWidth: 100 } ) ).toBe( false );
		} );
	} );

	describe( 'isAtStart', () => {
		it( 'returns true when at the start', () => {
			expect( isAtStart( { scrollDistance: 0 } ) ).toBe( true );
		} );
		it( 'returns true when overscrolled past the start (rubber-band)', () => {
			expect( isAtStart( { scrollDistance: -3 } ) ).toBe( true );
		} );
		it( 'returns false when scrolled', () => {
			expect( isAtStart( { scrollDistance: 50 } ) ).toBe( false );
		} );
	} );

	describe( 'isAtEnd', () => {
		it( 'returns true when scrolled to the end', () => {
			const m = { scrollDistance: 100, clientWidth: 100, scrollWidth: 200 };
			expect( isAtEnd( m ) ).toBe( true );
		} );
		it( 'returns false when more content remains', () => {
			const m = { scrollDistance: 50, clientWidth: 100, scrollWidth: 200 };
			expect( isAtEnd( m ) ).toBe( false );
		} );
	} );

	describe( 'calculateNewScrollDistance', () => {
		const buttonWidth = 60;

		it( 'returns null when tab is already in visible area', () => {
			const metrics = {
				scrollDistance: 0, scrollWidth: 500, clientWidth: 300,
				tabStart: 100, tabWidth: 50
			};
			expect( calculateNewScrollDistance( metrics, buttonWidth ) ).toBeNull();
		} );

		it( 'scrolls back to expose tab hidden behind prev button', () => {
			const metrics = {
				scrollDistance: 100, scrollWidth: 500, clientWidth: 300,
				tabStart: 110, tabWidth: 50
			};
			// visibleStart = 100 + 60 = 160. tabStart 110 < 160.
			// returns tabStart - buttonWidth = 110 - 60 = 50.
			expect( calculateNewScrollDistance( metrics, buttonWidth ) ).toBe( 50 );
		} );

		it( 'scrolls on to expose tab hidden behind next button', () => {
			const metrics = {
				scrollDistance: 0, scrollWidth: 500, clientWidth: 300,
				tabStart: 250, tabWidth: 50
			};
			// hasNextButton = true (300 < 500).
			// visibleEnd = 0 + 300 - 60 = 240. tabEnd 300 > 240.
			// returns tabEnd - clientWidth + buttonWidth = 300 - 300 + 60 = 60.
			expect( calculateNewScrollDistance( metrics, buttonWidth ) ).toBe( 60 );
		} );

		it( 'does not subtract prev-button width when at the start', () => {
			const metrics = {
				scrollDistance: 0, scrollWidth: 500, clientWidth: 300,
				tabStart: 10, tabWidth: 50
			};
			// hasPrevButton = false. visibleStart = 0. tabStart 10 not < 0.
			// hasNextButton = true. visibleEnd = 240. tabEnd 60 not > 240.
			expect( calculateNewScrollDistance( metrics, buttonWidth ) ).toBeNull();
		} );

		it( 'reserves nothing when there are no arrows', () => {
			const metrics = {
				scrollDistance: 0, scrollWidth: 500, clientWidth: 300,
				tabStart: 250, tabWidth: 50
			};
			// visibleEnd = 300. tabEnd 300 not > 300.
			expect( calculateNewScrollDistance( metrics, 0 ) ).toBeNull();
		} );
	} );
} );
