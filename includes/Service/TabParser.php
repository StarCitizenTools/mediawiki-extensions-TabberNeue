<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Service;

use MediaWiki\Extension\TabberNeue\Config\TabberOptions;
use MediaWiki\Html\Html;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;
use MediaWiki\Utils\UrlUtils;

class TabParser {
	// Note: <p> is intentionally excluded. recursiveTagParse adds <p> tags inconsistently
	// across tabs, so including it would cause inconsistent paragraph wrapping behavior.
	private const BLOCK_ELEMENTS = [ 'ol', 'ul', 'dl', 'div', 'table', 'pre', 'blockquote',
		'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'figure' ];

	private ?string $markupPattern = null;

	public function __construct(
		private readonly TabberOptions $options,
		private readonly UrlUtils $urlUtils
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

		if ( !$this->options->parseTabName ) {
			return $parser->getTargetLanguageConverter()->convertHtml( $label );
		}

		if ( !$this->hasWikitextMarkup( $label ) ) {
			$html = htmlspecialchars( $label, ENT_NOQUOTES | ENT_SUBSTITUTE );
			$options = $parser->getOptions();
			if ( $options->getDisableContentConversion() || $options->getInterfaceMessage() ) {
				return $html;
			}
			return $parser->getTargetLanguageConverter()->convert( $html );
		}

		return Parser::stripOuterParagraph( $parser->recursiveTagParseFully( $label ) );
	}

	/**
	 * Whether a label contains anything the parser would render differently
	 * from plain escaped text. Conservative: false positives only cost a parse.
	 */
	private function hasWikitextMarkup( string $label ): bool {
		$this->markupPattern ??= '/' . implode( '|', [
			'[\\[{<&\\x7f]',
			'[\\x00-\\x08\\x0a-\\x1f]',
			"''",
			'__',
			'^[*#:;=]',
			'^-{4}',
			' (?=[?:;!%»›])',
			'[«‹] ',
			'[\\x{00A0}\\x{0338}]',
			'(?i:' . $this->urlUtils->validAbsoluteProtocols() . ')',
		] ) . '/u';
		return preg_match( $this->markupPattern, $label ) !== 0;
	}

	/**
	 * Parses raw tab content wikitext into HTML.
	 */
	public function parseContent( string $rawContent, Parser $parser, PPFrame|false $frame = false ): string {
		$content = trim( $rawContent );
		if ( $content === '' ) {
			return '';
		}

		// Always wrap in newlines so the parser recognizes wikitext line-start
		// syntax (lists, headings, etc.) regardless of where they appear in the content.
		$content = "\n$content\n";

		// Do not trim() the output — the parser relies on trailing newlines as
		// internal state between successive recursiveTagParse calls. Trimming
		// causes subsequent tabs to lose list and heading recognition.
		$content = $parser->recursiveTagParse( $content, $frame );

		// Wrap in <p> if the parsed content has no block-level elements,
		// since recursiveTagParse does not handle paragraph wrapping consistently.
		if ( $content !== '' && !$this->hasBlockElements( $content ) ) {
			$content = Html::rawElement( 'p', [], $content );
		}

		return $content;
	}

	private function hasBlockElements( string $html ): bool {
		$pattern = '<(' . implode( '|', self::BLOCK_ELEMENTS ) . ')[\s>]';
		return (bool)preg_match( '/' . $pattern . '/', $html );
	}
}
