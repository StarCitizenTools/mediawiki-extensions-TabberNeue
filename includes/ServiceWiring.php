<?php
declare( strict_types=1 );

use MediaWiki\Extension\TabberNeue\Config\TabberOptions;
use MediaWiki\Extension\TabberNeue\Handlers\TabberHandler;
use MediaWiki\Extension\TabberNeue\Handlers\TabberTranscludeHandler;
use MediaWiki\Extension\TabberNeue\Parsing\TabSegmentSplitter;
use MediaWiki\Extension\TabberNeue\Service\TabberRenderer;
use MediaWiki\Extension\TabberNeue\Service\TabIdRegistry;
use MediaWiki\Extension\TabberNeue\Service\TabModelBuilder;
use MediaWiki\Extension\TabberNeue\Service\TabParser;
use MediaWiki\Extension\TabberNeue\Transclusion\EagerTransclusionRenderer;
use MediaWiki\Extension\TabberNeue\Transclusion\LazyTransclusionRenderer;
use MediaWiki\Extension\TabberNeue\Transclusion\TransclusionTemplateRegistrar;
use MediaWiki\Extension\TabberNeue\Transclusion\TransclusionTitleResolver;
use MediaWiki\Html\TemplateParser;
use MediaWiki\MediaWikiServices;

return [
	'TabberNeue.TabberOptions' => static function ( MediaWikiServices $services ): TabberOptions {
		$config = $services->getMainConfig();
		return new TabberOptions(
			$config->get( 'TabberNeueParseTabName' ),
			$config->get( 'TabberNeueAddTabPrefix' )
		);
	},
	'TabberNeue.TabParser' => static function ( MediaWikiServices $services ): TabParser {
		return new TabParser(
			$services->getService( 'TabberNeue.TabberOptions' )
		);
	},
	'TabberNeue.TabIdRegistry' => static function ( MediaWikiServices $services ): TabIdRegistry {
		return new TabIdRegistry(
			$services->getService( 'TabberNeue.TabberOptions' )
		);
	},
	'TabberNeue.TabberRenderer' => static function ( MediaWikiServices $services ): TabberRenderer {
		return new TabberRenderer(
			new TemplateParser( __DIR__ . '/templates' )
		);
	},
	'TabberNeue.TabSegmentSplitter' => static function (): TabSegmentSplitter {
		return new TabSegmentSplitter();
	},
	'TabberNeue.TabModelBuilder' => static function ( MediaWikiServices $services ): TabModelBuilder {
		return new TabModelBuilder(
			$services->getService( 'TabberNeue.TabParser' ),
			$services->getService( 'TabberNeue.TabIdRegistry' )
		);
	},
	'TabberNeue.TransclusionTitleResolver' => static function (): TransclusionTitleResolver {
		return new TransclusionTitleResolver();
	},
	'TabberNeue.EagerTransclusionRenderer' => static function (): EagerTransclusionRenderer {
		return new EagerTransclusionRenderer();
	},
	'TabberNeue.LazyTransclusionRenderer' => static function ( MediaWikiServices $services ): LazyTransclusionRenderer {
		return new LazyTransclusionRenderer( $services->getHookContainer() );
	},
	'TabberNeue.TransclusionTemplateRegistrar' => static function (): TransclusionTemplateRegistrar {
		return new TransclusionTemplateRegistrar();
	},
	'TabberNeue.TabberHandler' => static function ( MediaWikiServices $services ): TabberHandler {
		return new TabberHandler(
			$services->getService( 'TabberNeue.TabberRenderer' ),
			$services->getService( 'TabberNeue.TabSegmentSplitter' ),
			$services->getService( 'TabberNeue.TabModelBuilder' )
		);
	},
	'TabberNeue.TabberTranscludeHandler' => static function ( MediaWikiServices $services ): TabberTranscludeHandler {
		return new TabberTranscludeHandler(
			$services->getService( 'TabberNeue.TabberRenderer' ),
			$services->getService( 'TabberNeue.TabSegmentSplitter' ),
			$services->getService( 'TabberNeue.TabParser' ),
			$services->getService( 'TabberNeue.TabIdRegistry' ),
			$services->getService( 'TabberNeue.TransclusionTitleResolver' ),
			$services->getService( 'TabberNeue.EagerTransclusionRenderer' ),
			$services->getService( 'TabberNeue.LazyTransclusionRenderer' ),
			$services->getService( 'TabberNeue.TransclusionTemplateRegistrar' )
		);
	},
];
