<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Transclusion;

use MediaWiki\Parser\Parser;
use MediaWiki\Title\Title;

/**
 * Records the transcluded page as a template dependency in
 * ParserOutput, so MW invalidates the cached output when the
 * transcluded page is edited.
 */
class TransclusionTemplateRegistrar {
	public function register( Title $title, Parser $parser ): void {
		$revRecord = $parser->fetchCurrentRevisionRecordOfTitle( $title );
		$parser->getOutput()->addTemplate(
			$title,
			$title->getArticleId(),
			$revRecord?->getId() ?? 0
		);
	}
}
