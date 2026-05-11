<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\DataModel;

/**
 * Intermediate record produced by TabberTranscludeWikitextProcessor.
 * Holds the resolved title-result; converted to a final TabModel
 * after eager/lazy rendering decides on the content HTML.
 */
class TransclusionTab {
	public function __construct(
		public readonly TabId $id,
		public readonly string $label,
		public readonly TransclusionTitleResult $titleResult
	) {
	}
}
