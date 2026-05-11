<?php

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Scribunto;

use MediaWiki\Extension\TabberNeue\Service\TabberRenderer;
use MediaWiki\Extension\TabberNeue\Service\TabModelBuilder;

/**
 * Bundle of TabberNeue services consumed by LuaLibrary.
 * Concentrates the one unavoidable service-locator call.
 */
class LuaServices {
	public function __construct(
		public readonly TabModelBuilder $tabModelBuilder,
		public readonly TabberRenderer $tabberRenderer
	) {
	}
}
