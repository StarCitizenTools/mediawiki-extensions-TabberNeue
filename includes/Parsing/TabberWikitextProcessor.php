<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Parsing;

use MediaWiki\Extension\TabberNeue\DataModel\TabModel;
use MediaWiki\Extension\TabberNeue\Service\TabIdGenerator;
use MediaWiki\Extension\TabberNeue\Service\TabParser;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;

class TabberWikitextProcessor implements WikitextProcessor {
	public function __construct(
		private Parser $parser,
		private PPFrame $frame,
		private readonly TabParser $tabParser,
		private readonly TabIdGenerator $tabIdGenerator
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
			if ( trim( $segment ) === '' ) {
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

		$label = $this->tabParser->parseLabel( $rawLabel, $this->parser );
		if ( $label === '' ) {
			return null;
		}

		$content = $this->tabParser->parseContent( $rawContent, $this->parser, $this->frame );

		$baseId = $this->tabIdGenerator->generateSanitizedId( $label );
		$uniqueName = $this->tabIdGenerator->ensureUniqueId( $baseId, $this->parser->getOutput() );
		return new TabModel( $uniqueName, $label, $content );
	}
}
