<?php

declare( strict_types=1 );

namespace TabberNeue;

use MediaWiki\Hook\ParserFirstCallInitHook;
use Parser;

class Hooks implements ParserFirstCallInitHook {
	/**
	 * @see https://www.mediawiki.org/wiki/Manual:Hooks/ParserFirstCallInit
	 *
	 * @param Parser $parser
	 */
	public function onParserFirstCallInit( $parser ) {
		$parser->setHook( 'tabber', Tabber::class . '::renderTabber' );
		$parser->setHook( 'tabbertransclude', TabberTransclude::class . '::renderTabberTransclude' );
	}
}
