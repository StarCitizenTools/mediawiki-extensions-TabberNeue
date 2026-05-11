<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Config;

/**
 * Immutable snapshot of TabberNeue configuration values.
 *
 * Constructed once per request from Config in ServiceWiring; passed
 * to services that need access to TabberNeue config flags. Replaces
 * scattered Config::get calls and duplicated bool constructor args.
 */
class TabberOptions {
	public function __construct(
		public readonly bool $parseTabName,
		public readonly bool $addTabPrefix
	) {
	}
}
