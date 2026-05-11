<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Unit\Config;

use Error;
use MediaWiki\Extension\TabberNeue\Config\TabberOptions;
use MediaWikiUnitTestCase;

/**
 * @group TabberNeue
 * @group Config
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Config\TabberOptions
 */
class TabberOptionsTest extends MediaWikiUnitTestCase {

	/**
	 * @covers ::__construct
	 */
	public function testStoresFlagsAsReadonlyProperties(): void {
		$options = new TabberOptions( true, false );

		$this->assertTrue( $options->parseTabName );
		$this->assertFalse( $options->addTabPrefix );
	}

	/**
	 * @covers ::__construct
	 */
	public function testReadonlyPreventsMutation(): void {
		$options = new TabberOptions( false, true );

		$this->expectException( Error::class );
		// @phan-suppress-next-line PhanTypeMismatchProperty
		$options->parseTabName = true;
	}
}
