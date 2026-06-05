<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Integration\Components;

use MediaWiki\Extension\TabberNeue\Components\TabberComponentTabs;
use MediaWikiIntegrationTestCase;

/**
 * TabberComponentTabs calls Sanitizer::validateTagAttributes which requires the service
 * container (for URL protocol validation), so integration test is required.
 *
 * @group TabberNeue
 * @group Components
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Components\TabberComponentTabs
 */
class TabberComponentTabsTest extends MediaWikiIntegrationTestCase {

	/**
	 * Helper to extract attributes as a flat assoc array.
	 */
	private function asAssoc( array $arrayAttrs ): array {
		$out = [];
		foreach ( $arrayAttrs as $entry ) {
			$out[ $entry['key'] ] = $entry['value'];
		}
		return $out;
	}

	/**
	 * @covers ::__construct
	 * @covers ::getTemplateData
	 */
	public function testBaseClassAlwaysPresent(): void {
		$tabs = new TabberComponentTabs( [], [] );

		$attrs = $this->asAssoc( $tabs->getTemplateData()['array-attributes'] );
		$this->assertArrayHasKey( 'class', $attrs );
		$this->assertStringContainsString( 'tabber', $attrs['class'] );
		$this->assertStringContainsString( 'tabber--init', $attrs['class'] );
	}

	/**
	 * @covers ::getTemplateData
	 */
	public function testCustomClassIsMerged(): void {
		$tabs = new TabberComponentTabs( [], [ 'class' => 'custom' ] );

		$attrs = $this->asAssoc( $tabs->getTemplateData()['array-attributes'] );
		$this->assertStringContainsString( 'tabber', $attrs['class'] );
		$this->assertStringContainsString( 'tabber--init', $attrs['class'] );
		$this->assertStringContainsString( 'custom', $attrs['class'] );
	}

	/**
	 * @covers ::getTemplateData
	 */
	public function testCustomIdAndDataAttributes(): void {
		$tabs = new TabberComponentTabs( [], [
			'id' => 'my-tabber',
			'data-test' => 'value',
		] );

		$attrs = $this->asAssoc( $tabs->getTemplateData()['array-attributes'] );
		$this->assertSame( 'my-tabber', $attrs['id'] );
		$this->assertSame( 'value', $attrs['data-test'] );
	}

	/**
	 * @covers ::getTemplateData
	 */
	public function testTabsArrayPassesThrough(): void {
		$tabsData = [ [ 'label' => 'A' ], [ 'label' => 'B' ] ];
		$tabs = new TabberComponentTabs( $tabsData, [] );

		$this->assertSame( $tabsData, $tabs->getTemplateData()['array-tabs'] );
	}

	/**
	 * @covers ::getTemplateData
	 */
	public function testWrapClassAddedWhenEnabled(): void {
		$tabs = new TabberComponentTabs( [], [], true );

		$attrs = $this->asAssoc( $tabs->getTemplateData()['array-attributes'] );
		$this->assertStringContainsString( 'tabber--wrap', $attrs['class'] );
	}

	/**
	 * @covers ::getTemplateData
	 */
	public function testWrapClassAbsentByDefault(): void {
		$tabs = new TabberComponentTabs( [], [] );

		$attrs = $this->asAssoc( $tabs->getTemplateData()['array-attributes'] );
		$this->assertStringNotContainsString( 'tabber--wrap', $attrs['class'] );
	}
}
