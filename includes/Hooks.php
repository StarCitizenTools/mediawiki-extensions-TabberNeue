<?php

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue;

use MediaWiki\Hook\ParserFirstCallInitHook;
use MediaWiki\Output\OutputPage;
use MediaWiki\Parser\Parser;
use Skin;

class Hooks implements ParserFirstCallInitHook {
	/**
	 * @see https://www.mediawiki.org/wiki/Extension:MobileFrontend/BeforePageDisplayMobile
	 */
	public static function onBeforePageDisplayMobile( OutputPage $out, Skin $sk ) {
		$out->addModuleStyles( [ 'ext.tabberNeue.mobile.styles' ] );
	}

	/**
	 * @see https://www.mediawiki.org/wiki/Manual:Hooks/ParserFirstCallInit
	 *
	 * @param Parser $parser
	 */
	public function onParserFirstCallInit( $parser ): void {
		$parser->setHook( 'tabber', Tabber::class . '::parserHook' );
		$parser->setHook( 'tabbertransclude', TabberTransclude::class . '::parserHook' );
	}
}
