<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\DataModel;

/**
 * One parsed line of <tabbertransclude> input.
 * `pageName` is the raw page-name string; `rawLabel` is the unparsed label.
 */
class TransclusionLine {
	public function __construct(
		public readonly string $pageName,
		public readonly string $rawLabel
	) {
	}
}
