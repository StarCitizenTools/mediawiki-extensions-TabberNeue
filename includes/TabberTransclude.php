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
use MediaWiki\MediaWikiServices;
use Parser;
use PPFrame;
use Sanitizer;
use TemplateParser;
use Title;

class TabberTransclude {

	/** @var bool */
	private static $useLegacyId = false;

	/**
	 * Parser callback for <tabbertransclude> tag
	 *
	 * @param string|null $input
	 * @param array $args
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string HTML
	 */
	public static function parserHook( ?string $input, array $args, Parser $parser, PPFrame $frame ) {
		if ( $input === null ) {
			return '';
		}

		$config = MediaWikiServices::getInstance()->getMainConfig();
		$parserOutput = $parser->getOutput();

		self::$useLegacyId = $config->get( 'TabberNeueUseLegacyTabIds' );

		$count = count( $parserOutput->getExtensionData( 'tabber-count' ) ?? [] );

		$html = self::render( $input, $count, $args, $parser, $frame );

		$parserOutput->appendExtensionData( 'tabber-count', ++$count );

		$parser->getOutput()->addModuleStyles( [ 'ext.tabberNeue.init.styles' ] );
		$parser->getOutput()->addModules( [ 'ext.tabberNeue' ] );

		$parser->addTrackingCategory( 'tabberneue-tabbertransclude-category' );
		return $html;
	}

	/**
	 * Renders the necessary HTML for a <tabbertransclude> tag.
	 *
	 * @param string $input The input URL between the beginning and ending tags.
	 * @param int $count Current Tabber count
	 * @param array $args
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string HTML
	 */
	public static function render( string $input, int $count, array $args, Parser $parser, PPFrame $frame ): string {
		$selected = true;
		$arr = explode( "\n", $input );
		$attr = [
			'id' => "tabber-$count",
			'class' => 'tabber tabber--init'
		];

		foreach ( $args as $attribute => $value ) {
			$attr = Sanitizer::mergeAttributes( $attr, [ $attribute => $value ] );
		}

		$data = [
			'array-tabs' => [],
			'html-attributes' => Sanitizer::safeEncodeTagAttributes( Sanitizer::validateTagAttributes( $attr, 'div' ) )
		];

		foreach ( $arr as $tab ) {
			$tabData = self::getTabData( $tab );
			if ( $tabData === [] ) {
				continue;
			}

			$tabpanelHtml = '';
			try {
				$tabpanelHtml = self::buildTabTransclude( $tabData, $parser, $frame, $selected );
			} catch ( Exception $e ) {
				// This can happen if a $currentTitle is null
				continue;
			}

			$data['array-tabs'][] = [
				'html-tabpanel' => $tabpanelHtml,
				'label' => $tabData['label'],
				'tabId' => "tabber-tab-{$tabData['id']}",
				'tabpanelId' => self::$useLegacyId ? $tabData['id'] : "tabber-tabpanel-{$tabData['id']}"
			];
		}

		$templateParser = new TemplateParser( __DIR__ . '/templates' );
		return $templateParser->processTemplate( 'Tabber', $data );
	}

	/**
	 * Get individual tab data from wikitext.
	 *
	 * @param string $tab tab wikitext
	 *
	 * @return array
	 */
	private static function getTabData( string $tab ): array {
		if ( empty( trim( $tab ) ) ) {
			return [];
		}

		// Transclude uses a different syntax: Page name|Tab label
		// Use array_pad to make sure at least 2 array values are always returned
		[ $content, $label ] = array_pad( explode( '|', $tab, 2 ), 2, '' );

		$label = trim( $label );
		// Label is empty, we cannot generate tabber
		if ( $label === '' ) {
			return [];
		}

		return [
			'label' => $label,
			'content' => trim( $content ),
			'id' => Sanitizer::escapeIdForAttribute( htmlspecialchars( $label ) )
		];
	}

	/**
	 * Build individual tab.
	 *
	 * @param array $tabData Tab data
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 * @param bool &$selected The tab is the selected one
	 *
	 * @return string HTML
	 * @throws Exception
	 */
	private static function buildTabTransclude( array $tabData, Parser $parser, PPFrame $frame, bool &$selected ): string {
		$tabName = $tabData['label'];
		$pageName = $tabData['content'];

		$dataProps = [];
		$title = Title::newFromText( trim( $pageName ) );
		if ( !$title ) {
			if ( empty( $tabName ) ) {
				$tabName = $pageName;
			}
			$tabBody = sprintf( '<div class="error">Invalid title: %s</div>', Sanitizer::escapeHtmlAllowEntities( $pageName ) );
		} else {
			$pageName = $title->getPrefixedText();
			if ( empty( $tabName ) ) {
				$tabName = $pageName;
			}
			$dataProps['page-title'] = $pageName;
			if ( $selected ) {
				$tabBody = $parser->recursiveTagParseFully(
					sprintf( '{{:%s}}', $pageName ),
					$frame
				);
			} else {
				$service = MediaWikiServices::getInstance();
				// Add a link placeholder, as a fallback if JavaScript doesn't execute
				$linkRenderer = $service->getLinkRenderer();
				$tabBody = sprintf(
					'<div class="tabber__transclusion">%s</div>',
					$linkRenderer->makeLink( $title, null, [ 'rel' => 'nofollow' ] )
				);
				$currentTitle = $parser->getPage();
				$query = sprintf(
					'?action=parse&format=json&formatversion=2&title=%s&text={{:%s}}&redirects=1&prop=text&disablelimitreport=1&disabletoc=1&wrapoutputclass=',
					urlencode( $currentTitle->getPrefixedText() ),
					urlencode( $pageName )
				);

				$utils = $service->getUrlUtils();
				$utils->expand( wfScript( 'api' ) . $query, PROTO_CANONICAL );

				$dataProps['load-url'] = $utils->expand( wfScript( 'api' ) . $query, PROTO_CANONICAL );
				$oldTabBody = $tabBody;
				// Allow extensions to update the lazy loaded tab
				$service->getHookContainer()->run(
					'TabberNeueRenderLazyLoadedTab',
					[ &$tabBody, &$dataProps, $parser, $frame ]
				);
				if ( $oldTabBody !== $tabBody ) {
					$parser->getOutput()->recordOption( 'tabberneuelazyupdated' );
				}
			}
			// Register as a template
			$revRecord = $parser->fetchCurrentRevisionRecordOfTitle( $title );
			$parser->getOutput()->addTemplate(
				$title,
				$title->getArticleId(),
				$revRecord ? $revRecord->getId() : null
			);
		}

		$tab = '<article id="tabber-tabpanel-' . $tabData['id'] . '" class="tabber__panel" data-mw-tabber-title="' . htmlspecialchars( $tabName ) . '"';
		$tab .= implode( array_map( static function ( $prop, $value ) {
			return sprintf( ' data-mw-tabber-%s="%s"', $prop, htmlspecialchars( $value ) );
		}, array_keys( $dataProps ), $dataProps ) );
		$tab .= '>' . $tabBody . '</article>';
		$selected = false;

		return $tab;
	}
}
