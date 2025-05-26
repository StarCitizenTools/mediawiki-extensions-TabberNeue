<?php

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue;

use MediaWiki\Config\Config;
use MediaWiki\Extension\TabberNeue\Service\TabNameHelper;
use MediaWiki\Hook\ParserFirstCallInitHook;
use MediaWiki\Html\TemplateParser;
use MediaWiki\Output\OutputPage;
use MediaWiki\Parser\Parser;
use Skin;

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
}
