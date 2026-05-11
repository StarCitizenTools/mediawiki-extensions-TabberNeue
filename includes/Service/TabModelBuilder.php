<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Service;

use MediaWiki\Extension\TabberNeue\DataModel\TabModel;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;

/**
 * Composes label parsing, content parsing, and ID allocation to build
 * a TabModel from raw input strings. Returns null when the label is
 * empty (after parse), signaling to callers to skip the tab.
 *
 * Used by TabberWikitextProcessor (for <tabber>) and LuaLibrary
 * (for mw.ext.tabber.render). TabberTranscludeWikitextProcessor does
 * NOT use this — its content is produced via title resolution, not
 * direct content parsing.
 */
class TabModelBuilder {
	public function __construct(
		private readonly TabParser $tabParser,
		private readonly TabIdRegistry $tabIdRegistry
	) {
	}

	public function build(
		string $rawLabel,
		string $rawContent,
		Parser $parser,
		?PPFrame $frame = null
	): ?TabModel {
		$label = $this->tabParser->parseLabel( $rawLabel, $parser );
		if ( $label === '' ) {
			return null;
		}

		$content = $this->tabParser->parseContent( $rawContent, $parser, $frame ?? false );
		$id = $this->tabIdRegistry->generateUniqueId( $label, $parser->getOutput() );
		return new TabModel( $id, $label, $content );
	}
}
