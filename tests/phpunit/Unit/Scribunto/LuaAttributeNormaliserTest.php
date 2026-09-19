<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Unit\Scribunto;

use InvalidArgumentException;
use MediaWiki\Extension\TabberNeue\Scribunto\LuaAttributeNormaliser;
use MediaWikiUnitTestCase;

/**
 * @group TabberNeue
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Scribunto\LuaAttributeNormaliser
 */
class LuaAttributeNormaliserTest extends MediaWikiUnitTestCase {

	/**
	 * @covers ::normalise
	 * @dataProvider provideAccepted
	 */
	public function testAccepted( $input, array $expected ): void {
		$this->assertSame( $expected, LuaAttributeNormaliser::normalise( $input ) );
	}

	public static function provideAccepted(): array {
		return [
			'nil' => [ null, [] ],
			'empty table' => [ [], [] ],
			'string values' => [
				[ 'id' => 'x', 'class' => 'y' ],
				[ 'id' => 'x', 'class' => 'y' ],
			],
			'data attribute' => [ [ 'data-foo' => 'bar' ], [ 'data-foo' => 'bar' ] ],
			// true must match a bare `<tabber wrap>`, which resolveTabWrap reads as ''.
			'true becomes a bare attribute' => [ [ 'wrap' => true ], [ 'wrap' => '' ] ],
			'false becomes the string false' => [ [ 'wrap' => false ], [ 'wrap' => 'false' ] ],
			'integer value' => [ [ 'tabindex' => 3 ], [ 'tabindex' => '3' ] ],
			'float value' => [ [ 'data-n' => 1.5 ], [ 'data-n' => '1.5' ] ],
			'empty string value' => [ [ 'wrap' => '' ], [ 'wrap' => '' ] ],
			// decodeTagAttributes lowercases tag attribute names, so { ID = .. }
			// must reach the same attribute as id=.. on the tag.
			'name is lowercased' => [ [ 'ID' => 'x' ], [ 'id' => 'x' ] ],
			'hyphenated and namespaced names' => [
				[ 'data-foo-bar' => '1', 'aria-label' => 'l', 'xmlns:x' => 'n' ],
				[ 'data-foo-bar' => '1', 'aria-label' => 'l', 'xmlns:x' => 'n' ],
			],
		];
	}

	/**
	 * @covers ::normalise
	 * @dataProvider provideRejected
	 */
	public function testRejected( $input, string $expectedMessageFragment ): void {
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessageMatches( '/' . preg_quote( $expectedMessageFragment, '/' ) . '/' );
		LuaAttributeNormaliser::normalise( $input );
	}

	public static function provideRejected(): array {
		return [
			// A Lua sequence { 'a', 'b' } arrives with integer keys.
			'sequence' => [ [ 'a', 'b' ], 'attribute name' ],
			'mixed sequence and map' => [ [ 'id' => 'x', 'stray' ], 'attribute name' ],
			'empty key' => [ [ '' => 'x' ], 'attribute name' ],
			'nested table value' => [
				[ 'id' => [ 'a' ] ],
				"attribute 'id' must be a string, number or boolean, table given",
			],
			'null value' => [
				[ 'id' => null ],
				"attribute 'id' must be a string, number or boolean, nil given",
			],
			'not a table' => [ 'id=x', 'attributes must be a table, string given' ],
			// U+000C is an HTML attribute separator that Sanitizer's `data-`
			// escape hatch does not exclude, so it must not reach the markup.
			'form feed splits the name' => [
				[ "data-x\x0Conmouseover" => 'alert(1)' ],
				'is not a valid HTML attribute name',
			],
			'space in name' => [
				[ 'data-x onmouseover' => 'alert(1)' ],
				'is not a valid HTML attribute name',
			],
			'quote in name' => [ [ 'data-x"y' => 'z' ], 'is not a valid HTML attribute name' ],
			'empty name' => [ [ '' => 'x' ], 'is not a valid HTML attribute name' ],
			'INF value' => [ [ 'data-n' => INF ], 'must be a finite number' ],
			'NAN value' => [ [ 'data-n' => NAN ], 'must be a finite number' ],
		];
	}
}
