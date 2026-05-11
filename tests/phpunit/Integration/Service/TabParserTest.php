<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Integration\Service;

use MediaWiki\Extension\TabberNeue\Config\TabberOptions;
use MediaWiki\Extension\TabberNeue\Service\TabParser;
use MediaWiki\Language\LanguageConverter;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\ParserOptions;
use MediaWikiIntegrationTestCase;

/**
 * Parser::stripOuterParagraph is a static method — it cannot be mocked via PHPUnit,
 * so TabParserTest lives here in Integration rather than Unit.
 * Tests that need the static method use a real Parser from the factory.
 * Tests that only exercise mockable instance methods still use createMock().
 *
 * @group TabberNeue
 * @group Service
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Service\TabParser
 */
class TabParserTest extends MediaWikiIntegrationTestCase {

	private function makeTabParser( bool $parseTabName = false ): TabParser {
		return new TabParser( new TabberOptions( $parseTabName, true ) );
	}

	private function makeRealParser(): Parser {
		$parser = $this->getServiceContainer()->getParserFactory()->create();
		// A freshly-created Parser hasn't been initialised. Set the three pieces
		// of state that startParse() (private) would normally set, then clearState()
		// to initialise mStripState and other internal fields required by
		// recursiveTagParse/recursiveTagParseFully.
		$parser->setOptions( ParserOptions::newFromAnon() );
		$parser->setOutputType( Parser::OT_HTML );
		$parser->clearState();
		return $parser;
	}

	/**
	 * @covers ::parseLabel
	 */
	public function testParseLabelEmptyReturnsEmpty(): void {
		$parser = $this->createMock( Parser::class );
		$this->assertSame( '', $this->makeTabParser()->parseLabel( '', $parser ) );
		$this->assertSame( '', $this->makeTabParser()->parseLabel( '   ', $parser ) );
	}

	/**
	 * @covers ::parseLabel
	 */
	public function testParseLabelWithoutParseTabNameUsesLanguageConverter(): void {
		$converter = $this->createMock( LanguageConverter::class );
		$converter->expects( $this->once() )
			->method( 'convertHtml' )
			->with( 'Label' )
			->willReturn( 'Converted' );

		$parser = $this->createMock( Parser::class );
		$parser->method( 'getTargetLanguageConverter' )->willReturn( $converter );

		$result = $this->makeTabParser( parseTabName: false )->parseLabel( 'Label', $parser );

		$this->assertSame( 'Converted', $result );
	}

	/**
	 * Parser::stripOuterParagraph is static so cannot be mocked — use a real Parser here.
	 * A fresh factory-created Parser has a default title and preprocessor, which is sufficient
	 * for recursiveTagParseFully to run on simple plain-text input.
	 *
	 * @covers ::parseLabel
	 */
	public function testParseLabelWithParseTabNameUsesRecursiveParse(): void {
		$parser = $this->makeRealParser();

		// Plain text input: recursiveTagParseFully wraps it in <p>…</p>;
		// stripOuterParagraph then removes that wrapper.
		$result = $this->makeTabParser( parseTabName: true )->parseLabel( 'Label', $parser );

		$this->assertSame( 'Label', $result );
	}

	/**
	 * @covers ::parseContent
	 */
	public function testParseContentEmptyReturnsEmpty(): void {
		$parser = $this->createMock( Parser::class );
		$this->assertSame( '', $this->makeTabParser()->parseContent( '', $parser ) );
	}

	/**
	 * @covers ::parseContent
	 */
	public function testParseContentWithoutBlockElementsGetsParagraphWrapped(): void {
		$parser = $this->createMock( Parser::class );
		$parser->method( 'recursiveTagParse' )->willReturn( 'plain text' );

		$result = $this->makeTabParser()->parseContent( 'plain text', $parser );

		$this->assertSame( '<p>plain text</p>', $result );
	}

	/**
	 * @covers ::parseContent
	 */
	public function testParseContentWithBlockElementsIsNotWrapped(): void {
		$parser = $this->createMock( Parser::class );
		$parser->method( 'recursiveTagParse' )->willReturn( '<ul><li>x</li></ul>' );

		$result = $this->makeTabParser()->parseContent( '* x', $parser );

		$this->assertStringNotContainsString( '<p><ul>', $result );
		$this->assertStringContainsString( '<ul>', $result );
	}
}
