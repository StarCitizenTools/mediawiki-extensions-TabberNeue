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
	 * @covers ::build
	 */
	public function testEmptyParsedLabelReturnsNull(): void {
		$tabParser = $this->createMock( TabParser::class );
		$tabParser->method( 'parseLabel' )->willReturn( '' );
		$tabIdRegistry = $this->createMock( TabIdRegistry::class );
		$tabIdRegistry->expects( $this->never() )->method( 'generateUniqueId' );

		$builder = new TabModelBuilder( $tabParser, $tabIdRegistry );
		$parser = $this->createMock( Parser::class );

		$this->assertNull( $builder->build( '', 'content', $parser ) );
	}

	/**
	 * @covers ::build
	 */
	public function testWhitespaceOnlyLabelReturnsNull(): void {
		$tabParser = $this->createMock( TabParser::class );
		$tabParser->method( 'parseLabel' )->willReturn( '' );
		$tabIdRegistry = $this->createMock( TabIdRegistry::class );

		$builder = new TabModelBuilder( $tabParser, $tabIdRegistry );
		$parser = $this->createMock( Parser::class );

		$this->assertNull( $builder->build( '   ', 'content', $parser ) );
	}

	/**
	 * @covers ::build
	 */
	public function testHappyPathBuildsTabModel(): void {
		$tabParser = $this->createMock( TabParser::class );
		$tabParser->method( 'parseLabel' )->willReturn( 'Hello' );
		$tabParser->method( 'parseContent' )->willReturn( '<p>Body</p>' );

		$expectedId = TabId::build( 'Hello', true );
		$tabIdRegistry = $this->createMock( TabIdRegistry::class );
		$tabIdRegistry->method( 'generateUniqueId' )->willReturn( $expectedId );

		$parserOutput = $this->createMock( ParserOutput::class );
		$parser = $this->createMock( Parser::class );
		$parser->method( 'getOutput' )->willReturn( $parserOutput );

		$builder = new TabModelBuilder( $tabParser, $tabIdRegistry );
		$tabModel = $builder->build( 'Hello', 'Body wikitext', $parser );

		$this->assertNotNull( $tabModel );
		$this->assertSame( 'Hello', $tabModel->label );
		$this->assertSame( '<p>Body</p>', $tabModel->content );
		$this->assertSame( $expectedId, $tabModel->id );
	}
}
