<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Transclusion;

use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;
use MediaWiki\Title\Title;

/**
 * Renders the first (currently-selected) tab of a tabbertransclude by
 * recursively parsing the {{:Title}} transclusion wikitext. Used only
 * for the leading tab; subsequent tabs use LazyTransclusionRenderer.
 */
class EagerTransclusionRenderer {
	public function render( Title $title, Parser $parser, PPFrame $frame ): string {
		return $parser->recursiveTagParseFully(
			sprintf( '{{:%s}}', $title->getPrefixedText() ),
			$frame
		);
	}
}
