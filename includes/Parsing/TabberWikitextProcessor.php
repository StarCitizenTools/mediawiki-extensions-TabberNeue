<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Parsing;

use MediaWiki\Config\Config;
use MediaWiki\Extension\TabberNeue\DataModel\TabModel;
use MediaWiki\Extension\TabberNeue\Service\TabNameHelper;
use MediaWiki\Html\Html;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;

class TabberWikitextProcessor implements WikitextProcessor {
	public function __construct(
		private Parser $parser,
		private PPFrame $frame,
		private Config $config,
		private readonly TabNameHelper $tabNameHelper
	) {
	}

	/**
	 * Processes the raw wikitext input for tabber.
	 * Returns an array of TabModel objects on success, or an HTML string on error.
	 *
	 * @return TabModel[]
	 */
	public function process( string $wikitext ): array {
		$tabModels = [];

		$segments = explode( '|-|', $wikitext );
		foreach ( $segments as $segment ) {
			if ( empty( trim( $segment ) ) ) {
				continue;
			}

			$tabModel = $this->parseTabSegment( $segment );
			if ( $tabModel !== null ) {
				$tabModels[] = $tabModel;
			}
		}

		return $tabModels;
	}

	/**
	 * Parses a single tab segment (label=content).
	 */
	private function parseTabSegment( string $tabSegment ): ?TabModel {
		$parts = explode( '=', $tabSegment, 2 );
		if ( count( $parts ) < 2 ) {
			return null;
		}
		[ $rawLabel, $rawContent ] = $parts;

		$label = $this->parseTabLabel( $rawLabel );
		if ( $label === '' ) {
			return null;
		}

		$isContentHTML = strpos( $rawContent, '<' ) === 0;
		$content = $this->parseTabContent( $rawContent );

		if ( $content !== '' && !$isContentHTML ) {
			$content = Html::rawElement( 'p', [], $content );
		}

		$baseId = $this->tabNameHelper->generateSanitizedId( $label );
		$uniqueName = $this->tabNameHelper->ensureUniqueId( $baseId, $this->parser->getOutput() );
		return new TabModel( $uniqueName, $label, $content );
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

		$wikitextCharacters = [ '*', '#', ';', ':', '[' ];
		if ( in_array( substr( $content, 0, 1 ), $wikitextCharacters, true ) ) {
			$content = "\n$content\n";
		}
		return $this->parser->recursiveTagParse( $content, $this->frame );
	}
}
