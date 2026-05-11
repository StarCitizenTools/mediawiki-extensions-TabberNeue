<?php
/**
 * TabberNeue
 * TabberTranscludeHandler Class
 * Implement <tabbertransclude> tag
 *
 * @package TabberNeue
 * @author  alistair3149, Eric Fortin, Alexia E. Smith, Ciencia Al Poder
 * @license GPL-3.0-or-later
 * @link    https://www.mediawiki.org/wiki/Extension:TabberNeue
 */

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Handlers;

use MediaWiki\Extension\TabberNeue\DataModel\TabModel;
use MediaWiki\Extension\TabberNeue\DataModel\TransclusionTab;
use MediaWiki\Extension\TabberNeue\Parsing\TabberTranscludeWikitextProcessor;
use MediaWiki\Extension\TabberNeue\Parsing\TabSegmentSplitter;
use MediaWiki\Extension\TabberNeue\Service\TabberRenderer;
use MediaWiki\Extension\TabberNeue\Service\TabIdRegistry;
use MediaWiki\Extension\TabberNeue\Service\TabParser;
use MediaWiki\Extension\TabberNeue\Transclusion\EagerTransclusionRenderer;
use MediaWiki\Extension\TabberNeue\Transclusion\LazyTransclusionRenderer;
use MediaWiki\Extension\TabberNeue\Transclusion\TransclusionTemplateRegistrar;
use MediaWiki\Extension\TabberNeue\Transclusion\TransclusionTitleResolver;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;

class TabberTranscludeHandler {

	public function __construct(
		private readonly TabberRenderer $renderer,
		private readonly TabSegmentSplitter $splitter,
		private readonly TabParser $tabParser,
		private readonly TabIdRegistry $tabIdRegistry,
		private readonly TransclusionTitleResolver $titleResolver,
		private readonly EagerTransclusionRenderer $eagerRenderer,
		private readonly LazyTransclusionRenderer $lazyRenderer,
		private readonly TransclusionTemplateRegistrar $templateRegistrar,
	) {
	}

	/**
	 * Parser callback for <tabbertransclude> tag
	 */
	public function parserHook( ?string $input, array $args, Parser $parser, PPFrame $frame ): string {
		if ( $input === null ) {
			return '';
		}
		return $this->render( $input, $args, $parser, $frame );
	}

	/**
	 * Renders the necessary HTML for a <tabbertransclude> tag.
	 */
	public function render( string $input, array $args, Parser $parser, PPFrame $frame ): string {
		$processor = new TabberTranscludeWikitextProcessor(
			$parser,
			$this->splitter,
			$this->tabParser,
			$this->tabIdRegistry,
			$this->titleResolver
		);
		$transclusionTabs = $processor->process( $input );

		$isFirstTab = true;
		$tabModels = [];
		foreach ( $transclusionTabs as $transclusionTab ) {
			$content = $this->buildTabContent( $transclusionTab, $parser, $frame, $isFirstTab );
			$isFirstTab = false;
			$tabModels[] = new TabModel( $transclusionTab->id, $transclusionTab->label, $content );
		}

		return $this->renderer->render(
			$tabModels, $args, $parser, 'tabberneue-tabbertransclude-category'
		);
	}

	/**
	 * Build individual tab content HTML string.
	 */
	private function buildTabContent(
		TransclusionTab $transclusionTab,
		Parser $parser,
		PPFrame $frame,
		bool $isFirstTab
	): string {
		if ( !$transclusionTab->titleResult->isSuccess() ) {
			return $transclusionTab->titleResult->getErrorBoxOrThrow();
		}
		$title = $transclusionTab->titleResult->getTitleOrThrow();

		$content = $isFirstTab
			? $this->eagerRenderer->render( $title, $parser, $frame )
			: $this->lazyRenderer->render( $title, $parser, $frame );

		$this->templateRegistrar->register( $title, $parser );
		return $content;
	}
}
