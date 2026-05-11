<?php

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue;

use MediaWiki\Extension\TabberNeue\Handlers\TabberHandler;
use MediaWiki\Extension\TabberNeue\Handlers\TabberTranscludeHandler;
use MediaWiki\Extension\TabberNeue\Scribunto\LuaLibrary;
use MediaWiki\Hook\ParserFirstCallInitHook;
use MediaWiki\Parser\Parser;

class Hooks implements ParserFirstCallInitHook {

	public function __construct(
		private readonly TabberHandler $tabberHandler,
		private readonly TabberTranscludeHandler $tabberTranscludeHandler,
	) {
	}

	/**
	 * @see https://www.mediawiki.org/wiki/Manual:Hooks/ParserFirstCallInit
	 *
	 * @param Parser $parser
	 */
	public function onParserFirstCallInit( $parser ): void {
		$parser->setHook( 'tabber', [ $this->tabberHandler, 'parserHook' ] );
		$parser->setHook( 'tabbertransclude', [ $this->tabberTranscludeHandler, 'parserHook' ] );
	}

	/**
	 * Static because Scribunto's ScribuntoExternalLibraries hook does not support
	 * instance handlers — only static callbacks or class strings are accepted.
	 *
	 * @return bool|void
	 */
	public static function onScribuntoExternalLibraries( string $engine, array &$extraLibraries ) {
		if ( $engine !== 'lua' ) {
			return;
		}

		$extraLibraries['mw.ext.tabber'] = LuaLibrary::class;
	}
}
