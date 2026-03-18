<?php
declare( strict_types=1 );

use MediaWiki\Extension\TabberNeue\Service\TabIdGenerator;
use MediaWiki\Extension\TabberNeue\Service\TabParser;
use MediaWiki\Extension\TabberNeue\Service\TabberRenderer;
use MediaWiki\Html\TemplateParser;
use MediaWiki\MediaWikiServices;

return [
	'TabberNeue.TabParser' => static function ( MediaWikiServices $services ): TabParser {
		return new TabParser(
			$services->getMainConfig()->get( 'TabberNeueParseTabName' )
		);
	},
	'TabberNeue.TabIdGenerator' => static function ( MediaWikiServices $services ): TabIdGenerator {
		return new TabIdGenerator(
			$services->getMainConfig()->get( 'TabberNeueParseTabName' )
		);
	},
	'TabberNeue.TabberRenderer' => static function ( MediaWikiServices $services ): TabberRenderer {
		return new TabberRenderer(
			$services->getMainConfig(),
			new TemplateParser( __DIR__ . '/templates' )
		);
	}
];
