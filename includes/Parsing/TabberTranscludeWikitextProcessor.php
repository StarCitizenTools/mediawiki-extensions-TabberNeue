<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Parsing;

use MediaWiki\Config\Config;
use MediaWiki\Extension\TabberNeue\DataModel\TabModel;
use MediaWiki\Extension\TabberNeue\Service\TabNameHelper;
use MediaWiki\Html\Html;
use MediaWiki\Parser\Parser;
use MediaWiki\Title\Title;

class TabberTranscludeWikitextProcessor implements WikitextProcessor {
	public function __construct(
		private Parser $parser,
		private Config $config,
		private readonly TabNameHelper $tabNameHelper
	) {
	}

	/**
	 * Processes the raw wikitext input for tabbertransclude.
	 * Each line of the wikitext is expected to be in the format: "Page name|Tab label".
	 *
	 * @return TabModel[] An array of TabModel objects.
	 */
	public function process( string $wikitext ): array {
		$tabModels = [];
		$lines = explode( "\n", $wikitext );

		foreach ( $lines as $line ) {
			if ( empty( trim( $line ) ) ) {
				continue;
			}

			[ $pageName, $label ] = array_pad( explode( '|', $line, 2 ), 2, '' );

			$label = $this->parseTabLabel( $label );
			if ( $label === '' ) {
				continue;
			}

			$baseId = $this->tabNameHelper->generateSanitizedId( $label );
			$uniqueName = $this->tabNameHelper->ensureUniqueId( $baseId, $this->parser->getOutput() );
			$tabModels[] = new TabModel( $uniqueName, $label, $this->parseTabContent( $pageName ) );
		}

		return $tabModels;
	}

	/**
	 * Parses the tab label.
	 */
	private function parseTabLabel( string $labelWikitext ): string {
		$label = trim( $labelWikitext );
		if ( $label === '' ) {
			return '';
		}

		if ( !$this->config->get( 'TabberNeueParseTabName' ) ) {
			$label = $this->parser->getTargetLanguageConverter()->convertHtml( $label );
		} else {
			$label = $this->parser->recursiveTagParseFully( $label );
			$label = $this->parser->stripOuterParagraph( $label );
		}
		return $label;
	}

	/**
	 * Parses the tab content.
	 */
	private function parseTabContent( string $contentWikitext ): string {
		$content = trim( $contentWikitext );
		if ( $content === '' ) {
			return '';
		}

		$title = Title::newFromText( trim( $content ) );
		if ( $title === null ) {
			return Html::errorBox( 'Invalid title: ' . htmlspecialchars( $content ) );
		}

		if ( !$title->exists() ) {
			return Html::errorBox( 'Page does not exist: ' . htmlspecialchars( $content ) );
		}

		return $title->getPrefixedText();
	}
}
