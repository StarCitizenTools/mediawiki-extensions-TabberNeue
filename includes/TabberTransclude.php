<?php
/**
 * TabberNeue
 * TabberTransclude Class
 * Implement <tabbertransclude> tag
 *
 * @package TabberNeue
 * @author  alistair3149, Eric Fortin, Alexia E. Smith, Ciencia Al Poder
 * @license GPL-3.0-or-later
 * @link    https://www.mediawiki.org/wiki/Extension:TabberNeue
 */

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue;

use Exception;
use MediaWiki\Config\Config;
use MediaWiki\Extension\TabberNeue\Components\TabberComponentTab;
use MediaWiki\Extension\TabberNeue\Components\TabberComponentTabs;
use MediaWiki\Extension\TabberNeue\Parsing\TabberTranscludeWikitextProcessor;
use MediaWiki\Extension\TabberNeue\Service\TabNameHelper;
use MediaWiki\Html\Html;
use MediaWiki\Html\TemplateParser;
use MediaWiki\MediaWikiServices;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;
use MediaWiki\Title\Title;

class TabberTransclude {

	public function __construct(
		private Config $config,
		private TemplateParser $templateParser,
		private readonly TabNameHelper $tabNameHelper
	) {
	}

	/**
	 * Parser callback for <tabbertransclude> tag
	 */
	public function parserHook( ?string $input, array $args, Parser $parser, PPFrame $frame ): string {
		if ( $input === null ) {
			return '';
		}

		$parserOutput = $parser->getOutput();
		$parserOutput->addModuleStyles( [ 'ext.tabberNeue.init.styles' ] );
		$parserOutput->addModules( [ 'ext.tabberNeue' ] );
		$parser->addTrackingCategory( 'tabberneue-tabbertransclude-category' );

		return $this->render( $input, $args, $parser, $frame );
	}

	/**
	 * Renders the necessary HTML for a <tabbertransclude> tag.
	 */
	public function render( string $input, array $args, Parser $parser, PPFrame $frame ): string {
		$isCurrentlySelectedTab = true;

		$processor = new TabberTranscludeWikitextProcessor( $parser, $this->config, $this->tabNameHelper );
		$tabModels = $processor->process( $input );

		$tabsData = [];
		$addTabPrefixConfig = $this->config->get( 'TabberNeueAddTabPrefix' );
		foreach ( $tabModels as $tabModel ) {
			$tabContent = '';
			try {
				$tabContent = $this->prepareTransclusionPanel(
					(string)$tabModel->content,
					$parser,
					$frame,
					$isCurrentlySelectedTab
				);
			} catch ( Exception $e ) {
				$tabContent = Html::errorBox( 'Error processing tab: ' . $tabModel->label );
			}

			$tab = new TabberComponentTab(
				$tabModel->name,
				$tabModel->label,
				$tabContent,
				$addTabPrefixConfig
			);

			if ( $isCurrentlySelectedTab ) {
				$isCurrentlySelectedTab = false;
			}

			$tabsData[] = $tab->getTemplateData();
		}

		$tabs = new TabberComponentTabs( $tabsData, $args );

		return $this->templateParser->processTemplate( 'Tabs', $tabs->getTemplateData() );
	}

	/**
	 * Build individual tab content HTML string.
	 *
	 * @throws Exception
	 */
	private function prepareTransclusionPanel( string $pageName, Parser $parser, PPFrame $frame, bool $isCurrentlySelectedTab ): string {
		$html = '';

		$title = Title::newFromText( trim( $pageName ) );
		if ( !$title ) {
			// The error state is already handled in TabberTranscludeWikitextProcessor::parseTabContent()
			// TODO: This is not the best way to handle this.
			return $pageName;
		}

		$titleText = $title->getPrefixedText();
		$wikitext = sprintf( '{{:%s}}', $titleText );

		if ( $isCurrentlySelectedTab ) {
			$html = $parser->recursiveTagParseFully(
				$wikitext,
				$frame
			);
		} else {
			$service = MediaWikiServices::getInstance();
			$innerContentHtml = $parser->getLinkRenderer()->makeLink( $title, null );

			// TODO: Should probably refactor this hook, not sure if it's used anywhere else.
			$originalinnerContentHtml = $innerContentHtml;

			// TODO: Maybe we should inject the hook container into the class.
			$service->getHookContainer()->run(
				'TabberNeueRenderLazyLoadedTab',
				[ &$innerContentHtml, $parser, $frame ]
			);
			if ( $originalinnerContentHtml !== $innerContentHtml ) {
				$parser->getOutput()->recordOption( 'tabberneuelazyupdated' );
			}

			$html = Html::rawElement(
				'div',
				[
					'class' => 'tabber__transclusion',
					'data-mw-tabber-page' => $titleText,
					'data-mw-tabber-revision' => $title->getLatestRevID()
				],
				$innerContentHtml
			);
		}

		// TODO: There might be a cleaner way to do this.
		$revRecord = $parser->fetchCurrentRevisionRecordOfTitle( $title );
		$parser->getOutput()->addTemplate(
			$title,
			$title->getArticleId(),
			$revRecord ? $revRecord->getId() : null
		);

		return $html;
	}
}
