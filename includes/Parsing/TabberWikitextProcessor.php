<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Parsing;

use MediaWiki\Extension\TabberNeue\DataModel\TabModel;
use MediaWiki\Extension\TabberNeue\Service\TabModelBuilder;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;

class TabberWikitextProcessor {
	public function __construct(
		private Parser $parser,
		private PPFrame $frame,
		private readonly TabSegmentSplitter $splitter,
		private readonly TabModelBuilder $tabModelBuilder
	) {
	}

	/** @return TabModel[] */
	public function process( string $wikitext ): array {
		$tabModels = [];
		foreach ( $this->splitter->splitTabber( $wikitext ) as $segment ) {
			$tabModel = $this->tabModelBuilder->build(
				$segment->rawLabel,
				$segment->rawContent,
				$this->parser,
				$this->frame
			);
			if ( $tabModel !== null ) {
				$tabModels[] = $tabModel;
			}
		}
		return $tabModels;
	}
}
