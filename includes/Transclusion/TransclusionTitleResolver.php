<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Transclusion;

use MediaWiki\Extension\TabberNeue\DataModel\TransclusionTitleResult;
use MediaWiki\Html\Html;
use MediaWiki\Title\Title;

/**
 * Resolves a raw page-name string from <tabbertransclude> input into
 * a Title (if valid and existing) or an HTML error box (if not).
 */
class TransclusionTitleResolver {

	public function resolve( string $pageName ): TransclusionTitleResult {
		$trimmed = trim( $pageName );
		if ( $trimmed === '' ) {
			return TransclusionTitleResult::error(
				Html::errorBox( 'Empty page name' )
			);
		}

		$title = Title::newFromText( $trimmed );
		if ( $title === null ) {
			return TransclusionTitleResult::error(
				Html::errorBox( 'Invalid title: ' . htmlspecialchars( $trimmed ) )
			);
		}

		if ( !$title->exists() ) {
			return TransclusionTitleResult::error(
				Html::errorBox( 'Page does not exist: ' . htmlspecialchars( $trimmed ) )
			);
		}

		return TransclusionTitleResult::success( $title );
	}
}
