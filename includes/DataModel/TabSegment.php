<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\DataModel;

/**
 * Raw tab segment as produced by TabSegmentSplitter::splitTabber().
 * Holds the unparsed label and content; downstream stages parse them.
 */
class TabSegment {
	public function __construct(
		public readonly string $rawLabel,
		public readonly string $rawContent
	) {
	}
}
