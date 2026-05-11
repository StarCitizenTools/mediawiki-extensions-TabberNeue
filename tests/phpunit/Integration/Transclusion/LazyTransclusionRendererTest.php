<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Integration\Transclusion;

use MediaWiki\Extension\TabberNeue\Transclusion\LazyTransclusionRenderer;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\ParserOptions;
use MediaWikiIntegrationTestCase;

/**
 * @group TabberNeue
 * @group Database
 * @group Transclusion
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Transclusion\LazyTransclusionRenderer
 */
class LazyTransclusionRendererTest extends MediaWikiIntegrationTestCase {

	private function makeRealParser(): Parser {
		$parser = $this->getServiceContainer()->getParserFactory()->create();
		$parser->setOptions( ParserOptions::newFromAnon() );
		$parser->setOutputType( Parser::OT_HTML );
		$parser->clearState();
		return $parser;
	}

	private function makeRenderer(): LazyTransclusionRenderer {
		return new LazyTransclusionRenderer( $this->getServiceContainer()->getHookContainer() );
	}

	/**
	 * @covers ::render
	 * @covers ::__construct
	 */
	public function testRenderProducesPlaceholderDivWithDataAttributes(): void {
		$page = $this->getExistingTestPage( 'TabberNeueTestLazy_' . uniqid() );
		$title = $page->getTitle();

		$parser = $this->makeRealParser();
		$frame = $parser->getPreprocessor()->newFrame();

		$html = $this->makeRenderer()->render( $title, $parser, $frame );

		$this->assertStringContainsString( 'class="tabber__transclusion"', $html );
		$this->assertStringContainsString(
			'data-mw-tabber-page="' . htmlspecialchars( $title->getPrefixedText() ) . '"',
			$html
		);
		// Don't assert the exact revision ID — it depends on the test DB state.
		$this->assertMatchesRegularExpression(
			'/data-mw-tabber-revision="\d+"/',
			$html,
			'Placeholder should expose a numeric revision attribute'
		);
		// The default inner content is a link to the transcluded page.
		$this->assertStringContainsString( 'href=', $html );
	}

	/**
	 * @covers ::render
	 */
	public function testRenderRecordsLazyUpdatedWhenLegacyHookMutates(): void {
		$page = $this->getExistingTestPage( 'TabberNeueTestLazyHook_' . uniqid() );
		$title = $page->getTitle();

		$parser = $this->makeRealParser();
		$frame = $parser->getPreprocessor()->newFrame();

		// Register a temporary legacy hook handler that mutates the inner HTML.
		$this->setTemporaryHook(
			'TabberNeueRenderLazyLoadedTab',
			static function ( &$innerContentHtml, $parser, $frame ) {
				$innerContentHtml = '<span class="custom-lazy-content">replaced</span>';
			}
		);

		// The renderer emits a deprecation when the legacy hook has handlers; that's
		// expected behavior here, not a test failure.
		$this->expectDeprecationAndContinue(
			'/TabberNeueRenderLazyLoadedTab hook is deprecated/'
		);

		$html = $this->makeRenderer()->render( $title, $parser, $frame );

		$this->assertStringContainsString( 'custom-lazy-content', $html );
		$this->assertContains(
			'tabberneuelazyupdated',
			$parser->getOutput()->getUsedOptions(),
			'tabberneuelazyupdated cache option should be recorded when handler mutates inner HTML'
		);
	}
}
