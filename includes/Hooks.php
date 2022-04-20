<?php

declare( strict_types=1 );

namespace TabberNeue;

use Parser;

class Hooks {
	/**
	 * Sets up this extension's parser functions.
	 *
	 * @param Parser $parser Parser object passed as a reference.
	 */
	public static function onParserFirstCallInit( Parser $parser ) {
		$parser->setHook( 'tabber', TabberNeue::class . '::renderTabber' );
		$parser->setHook( 'tabbertransclude', TabberNeue::class . '::renderTabberTransclude' );
	}
}
