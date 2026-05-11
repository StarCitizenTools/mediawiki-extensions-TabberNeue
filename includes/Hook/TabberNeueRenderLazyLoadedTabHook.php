<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Hook;

use MediaWiki\Parser\Parser;
use MediaWiki\Title\Title;

/**
 * Hook fired when TabberNeue renders the placeholder for a lazy-loaded
 * transclusion tab (every tab except the first).
 *
 * Replaces the legacy untyped `TabberNeueRenderLazyLoadedTab` hook that
 * passed $innerContentHtml by reference. Handlers of this typed
 * interface set $result to replacement HTML, or leave it null to keep
 * the default unchanged.
 */
interface TabberNeueRenderLazyLoadedTabHook {

	/**
	 * @param string $defaultHtml The HTML the renderer would otherwise emit
	 *   (a link to the transcluded page).
	 * @param Title $title The transcluded page.
	 * @param Parser $parser The parser running the current parse.
	 * @param string|null &$result Set to replacement HTML to override the
	 *   default. Leave null to keep the default (or let a later handler
	 *   decide). Once a handler sets this to a non-null string the typed
	 *   dispatch stops; the value is used and the legacy hook is skipped.
	 */
	public function onTabberNeueRenderLazyLoadedTab(
		string $defaultHtml,
		Title $title,
		Parser $parser,
		?string &$result
	): void;
}
