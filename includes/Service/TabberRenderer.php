<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Service;

use MediaWiki\Extension\TabberNeue\Components\TabberComponentTab;
use MediaWiki\Extension\TabberNeue\Components\TabberComponentTabs;
use MediaWiki\Extension\TabberNeue\DataModel\TabModel;
use MediaWiki\Html\TemplateParser;
use MediaWiki\Parser\Parser;

class TabberRenderer {

	public function __construct(
		private readonly TemplateParser $templateParser,
		private readonly bool $enableTabWrap = false
	) {
	}

	/**
	 * Resolve whether wrap mode is active: a per-tag `wrap` attribute overrides
	 * the wiki-wide default. A bare `<tabber wrap>` (empty value) enables it.
	 */
	public static function resolveTabWrap( array $args, bool $default ): bool {
		if ( !array_key_exists( 'wrap', $args ) ) {
			return $default;
		}
		$value = strtolower( trim( (string)$args['wrap'] ) );
		if ( $value === '' ) {
			return true;
		}
		return !in_array( $value, [ 'false', '0', 'no', 'off' ], true );
	}

	/**
	 * Renders TabModel[] to HTML, registering required ResourceLoader modules.
	 *
	 * @param TabModel[] $tabModels
	 */
	public function render(
		array $tabModels,
		array $args,
		Parser $parser,
		string $trackingCategory = 'tabberneue-tabber-category'
	): string {
		if ( $tabModels === [] ) {
			return '';
		}

		$wrap = self::resolveTabWrap( $args, $this->enableTabWrap );
		// `wrap` is not a valid div attribute; strip it so it does not leak into
		// the rendered markup (and would otherwise be dropped by validateTagAttributes).
		unset( $args['wrap'] );

		$parserOutput = $parser->getOutput();
		$parserOutput->addModuleStyles( [ 'ext.tabberNeue.init.styles' ] );
		$parserOutput->addModules( [ 'ext.tabberNeue' ] );
		$parser->addTrackingCategory( $trackingCategory );

		$tabsData = [];
		foreach ( $tabModels as $tabModel ) {
			$tab = new TabberComponentTab(
				$tabModel->id,
				$tabModel->label,
				$tabModel->content
			);
			$tabsData[] = $tab->getTemplateData();
		}

		$tabs = new TabberComponentTabs( $tabsData, $args, $wrap );

		return $this->templateParser->processTemplate( 'Tabs', $tabs->getTemplateData() );
	}
}
