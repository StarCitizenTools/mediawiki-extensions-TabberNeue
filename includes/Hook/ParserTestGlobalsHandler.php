<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Hook;

use MediaWiki\Hook\ParserTestGlobalsHook;
use MediaWiki\MediaWikiServices;

/**
 * Resets TabberNeue's config-dependent services before each parser test so
 * that per-test `!! config` overrides (e.g. wgTabberNeueParseTabName) are
 * picked up instead of the cached service from the previous test.
 *
 * The `!! config` directive sets $GLOBALS before executeSetupSnippets() calls
 * the callables in the $globals array.  Adding a callable here means it runs
 * after the globals have been updated but before the parser begins the test,
 * ensuring every service that reads TabberNeue config gets a fresh instance.
 */
class ParserTestGlobalsHandler implements ParserTestGlobalsHook {

	/**
	 * @see https://www.mediawiki.org/wiki/Manual:Hooks/ParserTestGlobals
	 *
	 * @param array &$globals
	 */
	public function onParserTestGlobals( &$globals ): void {
		$globals[] = static function () {
			$services = MediaWikiServices::getInstance();
			// Reset upstream first so downstream pulls a fresh dependency.
			$services->resetServiceForTesting( 'TabberNeue.TabberOptions' );
			$services->resetServiceForTesting( 'TabberNeue.TabParser' );
			$services->resetServiceForTesting( 'TabberNeue.TabIdRegistry' );
			$services->resetServiceForTesting( 'TabberNeue.TabModelBuilder' );
			$services->resetServiceForTesting( 'TabberNeue.TabberHandler' );
			$services->resetServiceForTesting( 'TabberNeue.TabberTranscludeHandler' );
			// HookContainer caches hook handler objects (including the Hooks class
			// that injects TabberHandler). Resetting it forces a fresh Hooks instance
			// with the updated services the next time ParserFactory creates a Parser.
			// This must run before ParserFactory is reset (the core $reset callable).
			$services->resetServiceForTesting( 'HookContainer' );
		};
	}
}
