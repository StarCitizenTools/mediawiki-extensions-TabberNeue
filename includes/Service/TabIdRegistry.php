<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Service;

use MediaWiki\Extension\TabberNeue\Config\TabberOptions;
use MediaWiki\Extension\TabberNeue\DataModel\TabId;
use MediaWiki\Parser\ParserOutput;

/**
 * Allocates unique tab identifiers, tracking already-used IDs in
 * ParserOutput's extension data so duplicates within a single page
 * get a counter suffix.
 *
 * Renamed from TabIdGenerator — "Generator" implied pure construction,
 * but this class mutates ParserOutput state. "Registry" is accurate.
 */
class TabIdRegistry {
	public function __construct(
		private readonly TabberOptions $options
	) {
	}

	/**
	 * Returns a TabId guaranteed unique within the given ParserOutput.
	 */
	public function generateUniqueId( string $label, ParserOutput $parserOutput ): TabId {
		$base = $this->sanitize( $label );
		$base = $this->ensureUnique( $base, $parserOutput );
		return TabId::build( $base, $this->options->addTabPrefix );
	}

	private function sanitize( string $label ): string {
		if ( $this->options->parseTabName ) {
			$label = htmlspecialchars( strip_tags( $label ) );
		}
		// NOTE: passthrough kept here intentionally for Task 3.
		// Sanitization is hardened in Task 4 (separate commit).
		return $label;
	}

	private function ensureUnique( string $base, ParserOutput $parserOutput ): string {
		$existingIds = $parserOutput->getExtensionData( 'tabber-ids' ) ?? [];
		$counter = ( $existingIds[ $base ] ?? 0 ) + 1;
		$existingIds[ $base ] = $counter;
		$parserOutput->setExtensionData( 'tabber-ids', $existingIds );
		return $counter > 1 ? $base . '_' . $counter : $base;
	}
}
