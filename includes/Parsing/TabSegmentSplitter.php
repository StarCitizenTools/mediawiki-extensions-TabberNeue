<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Parsing;

use MediaWiki\Extension\TabberNeue\DataModel\TabSegment;
use MediaWiki\Extension\TabberNeue\DataModel\TransclusionLine;

/**
 * Pure splitting of <tabber> and <tabbertransclude> input syntax.
 * No MediaWiki dependencies — fully unit-testable.
 */
class TabSegmentSplitter {

	/**
	 * Splits <tabber> input into segments. Format:
	 *   |-|Label1=Content1|-|Label2=Content2...
	 *
	 * Empty segments are skipped. Segments without an `=` are skipped.
	 *
	 * @return TabSegment[]
	 */
	public function splitTabber( string $wikitext ): array {
		$segments = [];
		foreach ( explode( '|-|', $wikitext ) as $segment ) {
			if ( trim( $segment ) === '' ) {
				continue;
			}
			$parts = explode( '=', $segment, 2 );
			if ( count( $parts ) < 2 ) {
				continue;
			}
			$segments[] = new TabSegment( $parts[0], $parts[1] );
		}
		return $segments;
	}

	/**
	 * Splits <tabbertransclude> input into lines. Format (one per line):
	 *   PageName|Label
	 *
	 * Empty lines are skipped. Missing labels become empty strings.
	 *
	 * @return TransclusionLine[]
	 */
	public function splitTransclude( string $wikitext ): array {
		$lines = [];
		foreach ( explode( "\n", $wikitext ) as $line ) {
			if ( trim( $line ) === '' ) {
				continue;
			}
			[ $pageName, $rawLabel ] = array_pad( explode( '|', $line, 2 ), 2, '' );
			$lines[] = new TransclusionLine( $pageName, $rawLabel );
		}
		return $lines;
	}
}
