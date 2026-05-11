<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Unit\Components;

use MediaWiki\Extension\TabberNeue\Components\TabberComponentTab;
use MediaWiki\Extension\TabberNeue\DataModel\TabId;
use MediaWikiUnitTestCase;

/**
 * @group TabberNeue
 * @group Components
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Components\TabberComponentTab
 */
class TabberComponentTabTest extends MediaWikiUnitTestCase {

	/**
	 * @covers ::__construct
	 * @covers ::getTemplateData
	 */
	public function testGetTemplateDataShape(): void {
		$id = TabId::build( 'Hello', true );
		$tab = new TabberComponentTab( $id, 'Hello', '<p>body</p>' );

		$data = $tab->getTemplateData();

		$this->assertSame( 'Hello', $data['label'] );
		$this->assertSame( '<p>body</p>', $data['content'] );

		$this->assertSame(
			[
				[ 'key' => 'id', 'value' => 'tabber-Hello-label' ],
				[ 'key' => 'href', 'value' => '#tabber-Hello' ],
				[ 'key' => 'aria-controls', 'value' => 'tabber-Hello' ],
			],
			$data['array-tab-attributes']
		);

		$this->assertSame(
			[
				[ 'key' => 'id', 'value' => 'tabber-Hello' ],
				[ 'key' => 'aria-labelledby', 'value' => 'tabber-Hello-label' ],
			],
			$data['array-tabpanel-attributes']
		);
	}
}
