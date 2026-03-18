<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Service;

use MediaWiki\Html\Html;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;

class TabParser {
	public function __construct(
		private readonly bool $parseTabName
	) {
	}

	/**
	 * Parses a raw tab label string into its display form.
	 */
	public function parseLabel( string $rawLabel, Parser $parser ): string {
		$label = trim( $rawLabel );
		if ( $label === '' ) {
			return '';
		}

		if ( !$this->parseTabName ) {
			return $parser->getTargetLanguageConverter()->convertHtml( $label );
		}

		$label = $parser->recursiveTagParseFully( $label );
		return $parser->stripOuterParagraph( $label );
	}

	/**
	 * Parses raw tab content wikitext into HTML.
	 */
	public function parseContent( string $rawContent, Parser $parser, PPFrame|false $frame = false ): string {
		$content = trim( $rawContent );
		if ( $content === '' ) {
			return '';
		}

		$isContentHTML = str_starts_with( $content, '<' );

		$wikitextCharacters = [ '*', '#', ';', ':', '[' ];
		if ( in_array( $content[0], $wikitextCharacters, true ) ) {
			$content = "\n$content\n";
		}

		$content = $parser->recursiveTagParse( $content, $frame );

		if ( $content !== '' && !$isContentHTML ) {
			$content = Html::rawElement( 'p', [], $content );
		}

		return $content;
	}
}
