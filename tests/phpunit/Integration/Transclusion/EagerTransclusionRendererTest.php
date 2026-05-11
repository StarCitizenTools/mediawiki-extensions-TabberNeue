<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Integration\Transclusion;

use MediaWiki\Extension\TabberNeue\Transclusion\EagerTransclusionRenderer;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\ParserOptions;
use MediaWikiIntegrationTestCase;

/**
 * @group TabberNeue
 * @group Database
 * @group Transclusion
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Transclusion\EagerTransclusionRenderer
 */
class EagerTransclusionRendererTest extends MediaWikiIntegrationTestCase {

	private function makeRealParser(): Parser {
		$parser = $this->getServiceContainer()->getParserFactory()->create();
		$parser->setOptions( ParserOptions::newFromAnon() );
		$parser->setOutputType( Parser::OT_HTML );
		$parser->clearState();
		return $parser;
	}

	/**
	 * @covers ::render
	 */
	public function testRenderTranscludesTitleContent(): void {
		$page = $this->getExistingTestPage( 'TabberNeueTestEager_' . uniqid() );

		$parser = $this->makeRealParser();
		$frame = $parser->getPreprocessor()->newFrame();

		$html = ( new EagerTransclusionRenderer() )->render( $page->getTitle(), $parser, $frame );

		$this->assertIsString( $html );
		$this->assertNotEmpty( $html );
		// getExistingTestPage seeds the page with deterministic content
		// ("Test content for <ClassName>-<methodName>"); it should appear in
		// the rendered transclusion.
		$this->assertStringContainsString(
			'Test content',
			$html,
			'Eagerly-transcluded title content should appear in rendered HTML'
		);
	}
}
