<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Parsing;

use MediaWiki\Extension\TabberNeue\DataModel\TabModel;

interface WikitextProcessor {
	/**
	 * Processes the raw wikitext input.
	 *
	 * @return TabModel[]
	 */
	public function process( string $wikitext ): array;
}
