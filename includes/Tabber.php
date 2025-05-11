<?php
/**
 * TabberNeue
 * Tabber Class
 * Implement <tabber> tag
 *
 * @package TabberNeue
 * @author  alistair3149, Eric Fortin, Alexia E. Smith, Ciencia Al Poder
 * @license GPL-3.0-or-later
 * @link    https://www.mediawiki.org/wiki/Extension:TabberNeue
 */

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue;

use MediaWiki\Config\Config;
use MediaWiki\Extension\TabberNeue\Components\TabberComponentTab;
use MediaWiki\Extension\TabberNeue\Components\TabberComponentTabs;
use MediaWiki\Extension\TabberNeue\Parsing\TabberWikitextProcessor;
use MediaWiki\Extension\TabberNeue\Service\TabNameHelper;
use MediaWiki\Html\TemplateParser;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;

class Tabber {

	public function __construct(
		private Config $config,
		private TemplateParser $templateParser,
		private readonly TabNameHelper $tabNameHelper
	) {
	}

	/**
	 * Parser callback for <tabber> tag
	 */
	public function parserHook( ?string $input, array $args, Parser $parser, PPFrame $frame ): string {
		if ( $input === null ) {
			return '';
		}

		$parserOutput = $parser->getOutput();
		$parserOutput->addModuleStyles( [ 'ext.tabberNeue.init.styles' ] );
		$parserOutput->addModules( [ 'ext.tabberNeue' ] );
		$parser->addTrackingCategory( 'tabberneue-tabber-category' );

		return $this->render( $input, $args, $parser, $frame );
	}

	/**
	 * Renders the necessary HTML for a <tabber> tag.
	 */
	public function render( string $input, array $args, Parser $parser, PPFrame $frame ): string {
		$processor = new TabberWikitextProcessor(
			$parser,
			$frame,
			$this->config,
			$this->tabNameHelper
		);

		$tabModels = $processor->process( $input );

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
