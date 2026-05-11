<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Integration\Service;

use MediaWiki\Extension\TabberNeue\Config\TabberOptions;
use MediaWiki\Extension\TabberNeue\Service\TabIdRegistry;
use MediaWiki\Parser\ParserOutput;
use MediaWikiIntegrationTestCase;

/**
 * @group TabberNeue
 * @group Service
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Service\TabIdRegistry
 */
class TabIdRegistryTest extends MediaWikiIntegrationTestCase {

	private function makeRegistry( bool $parseTabName = false, bool $addTabPrefix = true ): TabIdRegistry {
		return new TabIdRegistry( new TabberOptions( $parseTabName, $addTabPrefix ) );
	}

	private function makeParserOutputStub(): ParserOutput {
		// Track extension data via a mutable closure-captured array.
		// Both callbacks must capture $extData by reference so that writes
		// made via setExtensionData are visible to subsequent getExtensionData calls.
		$extData = [];
		$po = $this->createMock( ParserOutput::class );
		$po->method( 'getExtensionData' )
			->willReturnCallback( static function ( $key ) use ( &$extData ) {
				return $extData[ $key ] ?? null;
			} );
		$po->method( 'setExtensionData' )
			->willReturnCallback( static function ( $key, $value ) use ( &$extData ) {
				$extData[ $key ] = $value;
			} );
		return $po;
	}

	/**
	 * @covers ::generateUniqueId
	 */
	public function testFirstIdHasNoSuffix(): void {
		$registry = $this->makeRegistry();
		$po = $this->makeParserOutputStub();

		$id = $registry->generateUniqueId( 'Hello', $po );

		$this->assertSame( 'Hello', $id->base );
		$this->assertSame( 'tabber-Hello', $id->panelId );
	}

	/**
	 * @covers ::generateUniqueId
	 */
	public function testDuplicateIdsGetCounterSuffix(): void {
		$registry = $this->makeRegistry();
		$po = $this->makeParserOutputStub();

		$first = $registry->generateUniqueId( 'Same', $po );
		$second = $registry->generateUniqueId( 'Same', $po );
		$third = $registry->generateUniqueId( 'Same', $po );

		$this->assertSame( 'Same', $first->base );
		$this->assertSame( 'Same_2', $second->base );
		$this->assertSame( 'Same_3', $third->base );
	}

	/**
	 * @covers ::generateUniqueId
	 */
	public function testParseTabNameStripsTags(): void {
		$registry = $this->makeRegistry( parseTabName: true );
		$po = $this->makeParserOutputStub();

		$id = $registry->generateUniqueId( '<b>Bold</b> label', $po );

		// strip_tags + escape: should not contain <b>
		$this->assertStringNotContainsString( '<', $id->base );
		$this->assertStringNotContainsString( '>', $id->base );
	}

	/**
	 * @covers ::generateUniqueId
	 */
	public function testAddTabPrefixFalseOmitsPrefix(): void {
		$registry = $this->makeRegistry( addTabPrefix: false );
		$po = $this->makeParserOutputStub();

		$id = $registry->generateUniqueId( 'NoPrefix', $po );

		$this->assertSame( 'NoPrefix', $id->panelId );
		$this->assertSame( 'NoPrefix-label', $id->labelId );
		$this->assertSame( '#NoPrefix', $id->fragment );
	}
}
