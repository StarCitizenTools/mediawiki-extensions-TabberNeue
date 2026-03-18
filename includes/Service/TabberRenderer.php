<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Service;

use MediaWiki\Config\Config;
use MediaWiki\Extension\TabberNeue\Components\TabberComponentTab;
use MediaWiki\Extension\TabberNeue\Components\TabberComponentTabs;
use MediaWiki\Extension\TabberNeue\DataModel\TabModel;
use MediaWiki\Html\TemplateParser;
use MediaWiki\Parser\Parser;

class TabberRenderer {

	public function __construct(
		private readonly Config $config,
		private readonly TemplateParser $templateParser
	) {
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

		$parserOutput = $parser->getOutput();
		$parserOutput->addModuleStyles( [ 'ext.tabberNeue.init.styles' ] );
		$parserOutput->addModules( [ 'ext.tabberNeue' ] );
		$parser->addTrackingCategory( $trackingCategory );

		$tabsData = [];
		$addTabPrefixConfig = $this->config->get( 'TabberNeueAddTabPrefix' );
		foreach ( $tabModels as $tabModel ) {
			$tab = new TabberComponentTab(
				$tabModel->name,
				$tabModel->label,
				$tabModel->content,
				$addTabPrefixConfig
			);
			$tabsData[] = $tab->getTemplateData();
		}

		$tabs = new TabberComponentTabs( $tabsData, $args );

		return $this->templateParser->processTemplate( 'Tabs', $tabs->getTemplateData() );
	}
}
