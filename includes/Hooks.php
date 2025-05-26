<?php

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue;

use MediaWiki\Config\Config;
use MediaWiki\Extension\TabberNeue\Scribunto\LuaLibrary;
use MediaWiki\Extension\TabberNeue\Service\TabNameHelper;
use MediaWiki\Hook\ParserFirstCallInitHook;
use MediaWiki\Html\TemplateParser;
use MediaWiki\Parser\Parser;

class Hooks implements ParserFirstCallInitHook {

	private TemplateParser $templateParser;

	public function __construct(
		private Config $config,
		private readonly TabNameHelper $tabNameHelper
	) {
		$this->templateParser = new TemplateParser( __DIR__ . '/templates' );
	}

	/**
	 * @see https://www.mediawiki.org/wiki/Manual:Hooks/ParserFirstCallInit
	 *
	 * @param Parser $parser
	 */
	public function onParserFirstCallInit( $parser ): void {
		$parser->setHook( 'tabber', [ new Tabber( $this->config, $this->templateParser, $this->tabNameHelper ), 'parserHook' ] );
		$parser->setHook( 'tabbertransclude', [ new TabberTransclude( $this->config, $this->templateParser, $this->tabNameHelper ), 'parserHook' ] );
	}

	/**
	 * Register Lua libraries for Scribunto.
	 * We cannot use hook handlers because it does not support conditional registration.
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
