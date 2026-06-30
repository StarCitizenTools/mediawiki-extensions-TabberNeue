<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Unit\Service;

use MediaWiki\Extension\TabberNeue\DataModel\TabId;
use MediaWiki\Extension\TabberNeue\Service\TabIdRegistry;
use MediaWiki\Extension\TabberNeue\Service\TabModelBuilder;
use MediaWiki\Extension\TabberNeue\Service\TabParser;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\ParserOutput;
use MediaWikiUnitTestCase;

/**
 * @group TabberNeue
 * @group Service
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Service\TabModelBuilder
 */
class TabModelBuilderTest extends MediaWikiUnitTestCase {

	/**
	 * @param string $parsedLabel Value TabParser::parseLabel should return
	 * @param string $parsedContent Value TabParser::parseContent should return
	 * @return TabParser
	 */
	private function newTabParser( string $parsedLabel, string $parsedContent = '' ): TabParser {
		$tabParser = $this->createMock( TabParser::class );
		$tabParser->method( 'parseLabel' )->willReturn( $parsedLabel );
		$tabParser->method( 'parseContent' )->willReturn( $parsedContent );
		return $tabParser;
	}

	/**
	 * @return Parser
	 */
	private function newParser(): Parser {
		$parser = $this->createMock( Parser::class );
		$parser->method( 'getOutput' )->willReturn( $this->createMock( ParserOutput::class ) );
		return $parser;
	}

	/**
	 * A tab whose label parses to empty is skipped (build returns null) and no
	 * ID is allocated for it.
	 *
	 * @covers ::build
	 * @dataProvider provideEmptyLabels
	 */
	public function testReturnsNullWhenLabelEmpty( string $rawLabel ): void {
		$tabIdRegistry = $this->createMock( TabIdRegistry::class );
		$tabIdRegistry->expects( $this->never() )->method( 'generateUniqueId' );

		$builder = new TabModelBuilder( $this->newTabParser( '' ), $tabIdRegistry );

		$this->assertNull( $builder->build( $rawLabel, 'content', $this->newParser() ) );
	}

	public static function provideEmptyLabels(): array {
		return [
			'empty string' => [ '' ],
			'whitespace only' => [ '   ' ],
		];
	}

	/**
	 * A labelled tab builds a model carrying the parsed content. Content is
	 * optional: an empty panel is valid and only an empty label skips the tab
	 * (#315).
	 *
	 * @covers ::build
	 * @dataProvider provideTabContents
	 */
	public function testBuildsModelForLabelledTab( string $parsedContent ): void {
		$expectedId = TabId::build( 'Hello', true );
		$tabIdRegistry = $this->createMock( TabIdRegistry::class );
		$tabIdRegistry->method( 'generateUniqueId' )->willReturn( $expectedId );

		$builder = new TabModelBuilder( $this->newTabParser( 'Hello', $parsedContent ), $tabIdRegistry );
		$tabModel = $builder->build( 'Hello', 'raw content', $this->newParser() );

		$this->assertNotNull( $tabModel );
		$this->assertSame( 'Hello', $tabModel->label );
		$this->assertSame( $parsedContent, $tabModel->content );
		$this->assertSame( $expectedId, $tabModel->id );
	}

	public static function provideTabContents(): array {
		return [
			'non-empty content' => [ '<p>Body</p>' ],
			'empty content (#315)' => [ '' ],
		];
	}
}
