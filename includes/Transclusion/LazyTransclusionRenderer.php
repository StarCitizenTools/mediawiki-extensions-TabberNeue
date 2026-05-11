<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Transclusion;

use MediaWiki\HookContainer\HookContainer;
use MediaWiki\Html\Html;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;
use MediaWiki\Title\Title;

/**
 * Renders a lazy-loaded transclusion tab: a placeholder div containing
 * a link to the target page. The frontend JS replaces the placeholder
 * with the parsed content via API call when the tab is selected.
 *
 * Owns the TabberNeueRenderLazyLoadedTab hook call site — the only
 * place in the extension that runs that hook. Records the
 * tabberneuelazyupdated cache option when a hook handler mutates the
 * inner HTML.
 *
 * Task 12 adds a typed replacement hook alongside this one and emits
 * a deprecation notice for handlers using the legacy signature.
 */
class LazyTransclusionRenderer {
	public function __construct(
		private readonly HookContainer $hookContainer
	) {
	}

	public function render( Title $title, Parser $parser, PPFrame $frame ): string {
		$innerContentHtml = $parser->getLinkRenderer()->makeLink( $title, null );
		$originalInnerContentHtml = $innerContentHtml;

		$this->hookContainer->run(
			'TabberNeueRenderLazyLoadedTab',
			[ &$innerContentHtml, $parser, $frame ]
		);

		if ( $originalInnerContentHtml !== $innerContentHtml ) {
			$parser->getOutput()->recordOption( 'tabberneuelazyupdated' );
		}

		return Html::rawElement(
			'div',
			[
				'class' => 'tabber__transclusion',
				'data-mw-tabber-page' => $title->getPrefixedText(),
				'data-mw-tabber-revision' => $title->getLatestRevID(),
			],
			$innerContentHtml
		);
	}
}
