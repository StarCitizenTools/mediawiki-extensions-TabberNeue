<?php

declare( strict_types=1 );

namespace TabberNeue;

use MediaWiki\Hook\ParserFirstCallInitHook;
use Parser;
use Wikimedia\Parsoid\Ext\ExtensionModule;

class Hooks implements ExtensionModule, ParserFirstCallInitHook {
	/**
	 * @see https://www.mediawiki.org/wiki/Manual:Hooks/ParserFirstCallInit
	 *
	 * @param Parser $parser
	 */
	public function onParserFirstCallInit( $parser ) {
		$parser->setHook( 'tabber', Tabber::class . '::parserHook' );
		$parser->setHook( 'tabbertransclude', TabberTransclude::class . '::parserHook' );
	}

	public function getConfig(): array {
		return [
			'name' => 'TabberNeue',
			'tags' => [
				[
					'name' => 'tabber',
					'handler' => TabberParsoid::class
				]
			]
		];
	}
}
