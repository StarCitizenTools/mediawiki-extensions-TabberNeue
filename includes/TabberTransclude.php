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
use MediaWiki\Html\Html;
use MediaWiki\Html\TemplateParser;
use MediaWiki\MediaWikiServices;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;
use MediaWiki\Title\Title;
use MediaWiki\Extension\TabberNeue\Parsing\TabberTranscludeWikitextProcessor;
use MediaWiki\Extension\TabberNeue\Components\TabberComponentTab;
use MediaWiki\Extension\TabberNeue\Components\TabberComponentTabs;

class TabberTransclude {

	private Config $config;
	private TemplateParser $templateParser;

	public function __construct( Config $config, TemplateParser $templateParser ) {
		$this->config = $config;
		$this->templateParser = $templateParser;
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

		// No longer generating a tabber-N baseId here. ID for main container comes from $args.
		$html = $this->render( $input, $args, $parser, $frame );
		return $html;
	}

	/**
	 * Renders the necessary HTML for a <tabbertransclude> tag.
	 */
	public function render( string $input, array $args, Parser $parser, PPFrame $frame ): string {
		$isCurrentlySelectedTab = true;

		$processor = new TabberTranscludeWikitextProcessor( $parser, $this->config );
		$tabModels = $processor->process( $input );

		$tabsData = [];
		$addTabPrefixConfig = $this->config->get( 'TabberNeueAddTabPrefix' );
		foreach ( $tabModels as $tabModel ) {
			$tabContent = '';
			try {
				$tabContent = $this->prepareTransclusionPanel(
					(string)$tabModel->content, // pageNameToTransclude
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
		$htmlBody = '';

		$title = Title::newFromText( trim( $pageName ) );
		if ( !$title ) {
			// The error state is already handled in TabberTranscludeWikitextProcessor::parseTabContent()
			// TODO: This is not the best way to handle this.
			return $pageName;
		}

		$wikitext = sprintf( '{{:%s}}', $pageName );

		if ( $isCurrentlySelectedTab ) {
			$htmlBody = $parser->recursiveTagParseFully(
				$wikitext,
				$frame
			);
		} else {
			$service = MediaWikiServices::getInstance();
			$innerContentHtml = $parser->getLinkRenderer()->makeLink( $title, null );

			$originalinnerContentHtml = $innerContentHtml;
			$service->getHookContainer()->run(
				'TabberNeueRenderLazyLoadedTab',
				[ &$innerContentHtml, $parser, $frame ]
			);
			if ( $originalinnerContentHtml !== $innerContentHtml ) {
				$parser->getOutput()->recordOption( 'tabberneuelazyupdated' );
			}

			$htmlBody = sprintf(
				'<div class="tabber__transclusion" data-mw-tabber-load-url="%s">%s</div>',
				$this->buildLazyLoadApiUrl( $parser->getPage(), $wikitext ),
				$innerContentHtml
			);
		}

		$revRecord = $parser->fetchCurrentRevisionRecordOfTitle( $title );
		$parser->getOutput()->addTemplate(
			$title,
			$title->getArticleId(),
			$revRecord ? $revRecord->getId() : null
		);

		return $htmlBody;
	}

	private function buildLazyLoadApiUrl( ?Title $currentParserTitle, string $textParamForQuery ): string {
		$queryParams = [
			'action' => 'parse',
			'format' => 'json',
			'formatversion' => 2,
			'text' => $textParamForQuery,
			'redirects' => 1,
			'prop' => 'text',
			'disablelimitreport' => 1,
			'disabletoc' => 1,
			'wrapoutputclass' => '',
		];

		if ( $currentParserTitle instanceof Title && $currentParserTitle->getPrefixedText() !== '' ) {
			$queryParams['title'] = $currentParserTitle->getPrefixedText();
		}
		$apiQueryPath = '?' . http_build_query( $queryParams );
		return  MediaWikiServices::getInstance()->getUrlUtils()->expand( wfScript( 'api' ) . $apiQueryPath, PROTO_CANONICAL );
	}
}
