<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Transclusion;

use MediaWiki\Extension\TabberNeue\Hook\TabberNeueRenderLazyLoadedTabHook;
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
 * Fires the typed TabberNeueRenderLazyLoadedTabHook first; if no typed
 * handler sets a non-null result, falls back to the legacy untyped
 * TabberNeueRenderLazyLoadedTab hook (with a one-time-per-request
 * deprecation notice when a legacy handler is registered).
 * Records the tabberneuelazyupdated cache option when either path
 * produces changed HTML.
 */
class LazyTransclusionRenderer {

	private bool $deprecationEmitted = false;

	public function __construct(
		private readonly HookContainer $hookContainer
	) {
	}

	public function render( Title $title, Parser $parser, PPFrame $frame ): string {
		$defaultHtml = $parser->getLinkRenderer()->makeLink( $title, null );
		$resultHtml = $this->dispatchHooks( $defaultHtml, $title, $parser, $frame );

		if ( $resultHtml !== $defaultHtml ) {
			$parser->getOutput()->recordOption( 'tabberneuelazyupdated' );
		}

		return Html::rawElement(
			'div',
			[
				'class' => 'tabber__transclusion',
				'data-mw-tabber-page' => $title->getPrefixedText(),
				'data-mw-tabber-revision' => $title->getLatestRevID(),
			],
			$resultHtml
		);
	}

	/**
	 * Runs the typed hook first via HookContainer dispatch; if no typed
	 * handler sets a non-null result, falls back to the legacy untyped
	 * hook (with a one-time-per-request deprecation notice when a
	 * legacy handler is registered).
	 *
	 * The typed hook interface uses a by-reference $result parameter
	 * (MediaWiki hook convention for value-returning hooks) rather than
	 * a PHP return value, so dispatch is compatible with HookContainer::run().
	 */
	private function dispatchHooks(
		string $defaultHtml,
		Title $title,
		Parser $parser,
		PPFrame $frame
	): string {
		$typedResult = null;
		if ( $this->hookContainer->isRegistered( TabberNeueRenderLazyLoadedTabHook::class ) ) {
			$this->hookContainer->run(
				TabberNeueRenderLazyLoadedTabHook::class,
				[ $defaultHtml, $title, $parser, &$typedResult ],
				[ 'abortable' => false ]
			);
		}
		// Phan can't see through HookContainer::run's by-reference parameter:
		// hook handlers may set $typedResult to a string, but Phan's flow analysis
		// only sees the null initialization.
		// @phan-suppress-next-line PhanImpossibleCondition
		if ( is_string( $typedResult ) ) {
			return $typedResult;
		}

		$legacyHtml = $defaultHtml;
		$this->hookContainer->run(
			'TabberNeueRenderLazyLoadedTab',
			[ &$legacyHtml, $parser, $frame ]
		);
		if ( !$this->deprecationEmitted
			&& $this->hookContainer->isRegistered( 'TabberNeueRenderLazyLoadedTab' ) ) {
			wfDeprecatedMsg(
				'The TabberNeueRenderLazyLoadedTab hook is deprecated. '
				. 'Implement MediaWiki\\Extension\\TabberNeue\\Hook\\TabberNeueRenderLazyLoadedTabHook instead.',
				'4.0',
				'TabberNeue'
			);
			$this->deprecationEmitted = true;
		}
		return $legacyHtml;
	}
}
