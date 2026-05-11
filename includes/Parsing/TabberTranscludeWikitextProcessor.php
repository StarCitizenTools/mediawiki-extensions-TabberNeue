<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Parsing;

use MediaWiki\Extension\TabberNeue\DataModel\TransclusionLine;
use MediaWiki\Extension\TabberNeue\DataModel\TransclusionTab;
use MediaWiki\Extension\TabberNeue\Service\TabIdRegistry;
use MediaWiki\Extension\TabberNeue\Service\TabParser;
use MediaWiki\Extension\TabberNeue\Transclusion\TransclusionTitleResolver;
use MediaWiki\Parser\Parser;

/**
 * Note: this processor no longer implements WikitextProcessor — it
 * returns TransclusionTab[] (an intermediate type), not TabModel[].
 * Kept in the Parsing namespace because it does input parsing.
 */
class TabberTranscludeWikitextProcessor {
	public function __construct(
		private Parser $parser,
		private readonly TabSegmentSplitter $splitter,
		private readonly TabParser $tabParser,
		private readonly TabIdRegistry $tabIdRegistry,
		private readonly TransclusionTitleResolver $titleResolver
	) {
	}

	/** @return TransclusionTab[] */
	public function process( string $wikitext ): array {
		$tabs = [];
		foreach ( $this->splitter->splitTransclude( $wikitext ) as $line ) {
			$tab = $this->buildTab( $line );
			if ( $tab !== null ) {
				$tabs[] = $tab;
			}
		}
		return $tabs;
	}

	private function buildTab( TransclusionLine $line ): ?TransclusionTab {
		$label = $this->tabParser->parseLabel( $line->rawLabel, $this->parser );
		if ( $label === '' ) {
			return null;
		}
		$id = $this->tabIdRegistry->generateUniqueId( $label, $this->parser->getOutput() );
		$titleResult = $this->titleResolver->resolve( $line->pageName );
		return new TransclusionTab( $id, $label, $titleResult );
	}
}
