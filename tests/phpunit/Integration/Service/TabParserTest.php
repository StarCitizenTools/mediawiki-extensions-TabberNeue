<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Integration\Service;

use MediaWiki\Extension\TabberNeue\Config\TabberOptions;
use MediaWiki\Extension\TabberNeue\Service\TabParser;
use MediaWiki\Language\LanguageConverter;
use MediaWiki\MainConfigNames;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\ParserOptions;
use MediaWikiIntegrationTestCase;

/**
 * Tests that compare against real parser output use a Parser from the factory;
 * tests that only exercise mockable instance methods use createMock().
 *
 * @group TabberNeue
 * @group Service
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Service\TabParser
 */
class TabParserTest extends MediaWikiIntegrationTestCase {

	private function makeTabParser( bool $parseTabName = false ): TabParser {
		return new TabParser(
			new TabberOptions( $parseTabName, true ),
			$this->getServiceContainer()->getUrlUtils()
		);
	}

	private function makeRealParser( ?ParserOptions $options = null ): Parser {
		$parser = $this->getServiceContainer()->getParserFactory()->create();
		// A freshly-created Parser hasn't been initialised. Set the three pieces
		// of state that startParse() (private) would normally set, then clearState()
		// to initialise mStripState and other internal fields required by
		// recursiveTagParse/recursiveTagParseFully.
		$parser->setOptions( $options ?? ParserOptions::newFromAnon() );
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
	 * @covers ::parseLabel
	 */
	public function testParseLabelWithParseTabNameUsesRecursiveParse(): void {
		$parser = $this->makeRealParser();

		$result = $this->makeTabParser( parseTabName: true )->parseLabel( "'''Label'''", $parser );

		$this->assertSame( '<b>Label</b>', $result );
	}

	/**
	 * A label with no wikitext markup must not go through the parser at all;
	 * it is escaped and language-converted directly.
	 *
	 * @covers ::parseLabel
	 */
	public function testParseLabelPlainTextDoesNotInvokeParser(): void {
		$converter = $this->createMock( LanguageConverter::class );
		$converter->method( 'convert' )->willReturnArgument( 0 );

		$parser = $this->createMock( Parser::class );
		$parser->method( 'getTargetLanguageConverter' )->willReturn( $converter );
		$parser->method( 'getOptions' )->willReturn( $this->createMock( ParserOptions::class ) );
		$parser->expects( $this->never() )->method( 'recursiveTagParseFully' );

		$result = $this->makeTabParser( parseTabName: true )->parseLabel( 'Player\'s "stats"', $parser );

		$this->assertSame( 'Player\'s "stats"', $result );
	}

	/**
	 * @covers ::parseLabel
	 * @dataProvider provideMarkupLabels
	 */
	public function testParseLabelWithMarkupInvokesParser( string $label ): void {
		$parser = $this->createMock( Parser::class );
		$parser->expects( $this->once() )
			->method( 'recursiveTagParseFully' )
			->with( $label )
			->willReturn( '<p>parsed</p>' );

		$result = $this->makeTabParser( parseTabName: true )->parseLabel( $label, $parser );

		$this->assertSame( 'parsed', $result );
	}

	public static function provideMarkupLabels(): array {
		return [
			'internal link' => [ '[[Main Page|Link]]' ],
			'template' => [ '{{Foo}}' ],
			'bold' => [ "''Bold''" ],
			'html tag' => [ '<b>Bold</b>' ],
			'entity' => [ 'a &amp; b' ],
			'behavior switch' => [ '__NOTOC__' ],
			'bullet list' => [ '*Foo' ],
			'numbered list' => [ '#1' ],
			'indent' => [ ': Foo' ],
			'definition' => [ '; Foo' ],
			'heading' => [ '= Foo =' ],
			'horizontal rule' => [ '----' ],
			'free external link' => [ 'see https://example.com/x' ],
			'mailto link' => [ 'mailto:x@y.z' ],
			'multiline' => [ "a\n* b" ],
			'french space before colon' => [ 'Stats : Level' ],
			'french space before question mark' => [ 'Why ?' ],
			'guillemet' => [ '« Intro »' ],
			'non-breaking space' => [ "a\u{00A0}b" ],
			'combining long solidus' => [ "a\u{0338}b" ],
			'control character' => [ "a\x01b" ],
		];
	}

	/**
	 * Whatever path a label takes, the output must be byte-identical to a full
	 * parse, so that rendered labels and generated tab IDs never change.
	 *
	 * @covers ::parseLabel
	 * @dataProvider provideEquivalenceLabels
	 */
	public function testParseLabelMatchesFullParse( string $label ): void {
		$parser = $this->makeRealParser();
		$expected = $parser->stripOuterParagraph( $parser->recursiveTagParseFully( $label ) );

		$result = $this->makeTabParser( parseTabName: true )->parseLabel( $label, $parser );

		$this->assertSame( $expected, $result );
	}

	public static function provideEquivalenceLabels(): array {
		return [
			'plain' => [ 'Tab 1' ],
			'apostrophe' => [ "Player's stats" ],
			'double quotes' => [ 'a "quoted" label' ],
			'greater than' => [ 'a > b' ],
			'percent' => [ '100%' ],
			'non-latin' => [ '日本語' ],
			'double space' => [ 'a  b' ],
			'colon' => [ 'Foo:Bar' ],
			'parentheses' => [ 'Level (2)' ],
			'pipe' => [ 'A | B' ],
			'tab' => [ "a\tb" ],
			'stray closers' => [ 'a }- b ]] c' ],
			'ampersand' => [ 'Q&A' ],
			'space before colon' => [ 'Stats : Level' ],
			'space before percent' => [ '100 %' ],
			'guillemets' => [ '« Intro »' ],
			'non-breaking space' => [ "a\u{00A0}b" ],
			'combining long solidus' => [ "a\u{0338}b" ],
			'bold' => [ "'''Bold'''" ],
			'numbered list' => [ '#1' ],
			'free link' => [ 'https://example.com' ],
		];
	}

	/**
	 * On a wiki with language variants, the parser converts the escaped HTML,
	 * so text before a bare ">" must still be converted.
	 *
	 * @covers ::parseLabel
	 */
	public function testParseLabelMatchesFullParseUnderLanguageVariant(): void {
		$this->overrideConfigValue( MainConfigNames::DefaultLanguageVariant, 'zh-hans' );
		$options = ParserOptions::newFromAnon();
		$options->setTargetLanguage( $this->getServiceContainer()->getLanguageFactory()->getLanguage( 'zh' ) );
		$parser = $this->makeRealParser( $options );
		$label = '測試 > 中文';
		$expected = $parser->stripOuterParagraph( $parser->recursiveTagParseFully( $label ) );
		$this->assertStringContainsString( '测试', $expected );

		$result = $this->makeTabParser( parseTabName: true )->parseLabel( $label, $parser );

		$this->assertSame( $expected, $result );
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
