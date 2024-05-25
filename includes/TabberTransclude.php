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
use Title;

class TabberTransclude {
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
		$html = self::render( $input, $parser, $frame );

		if ( $input === null ) {
			return '';
		}

		$parser->getOutput()->addModuleStyles( [ 'ext.tabberNeue.init.styles' ] );
		$parser->getOutput()->addModules( [ 'ext.tabberNeue' ] );

		$parser->addTrackingCategory( 'tabberneue-tabbertransclude-category' );
		return $html;
	}

	/**
	 * Renders the necessary HTML for a <tabbertransclude> tag.
	 *
	 * @param string $input The input URL between the beginning and ending tags.
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string HTML
	 */
	public static function render( string $input, Parser $parser, PPFrame $frame ): string {
		$selected = true;
		$arr = explode( "\n", $input );
		$htmlTabs = '';
		foreach ( $arr as $tab ) {
			try {
				$htmlTabs .= self::buildTabTransclude( $tab, $parser, $frame, $selected );
			} catch ( Exception $e ) {
				// This can happen if a $currentTitle is null
				continue;
			}
		}

		return '<div class="tabber">' .
			'<header class="tabber__header"></header>' .
			'<section class="tabber__section">' . $htmlTabs . '</section></div>';
	}

	/**
	 * Build individual tab.
	 *
	 * @param string $tab Tab information
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 * @param bool &$selected The tab is the selected one
	 *
	 * @return string HTML
	 * @throws Exception
	 */
	private static function buildTabTransclude( string $tab, Parser $parser, PPFrame $frame, bool &$selected ): string {
		if ( empty( trim( $tab ) ) ) {
			return '';
		}

		$dataProps = [];
		// Use array_pad to make sure at least 2 array values are always returned
		[ $pageName, $tabName ] = array_pad( explode( '|', $tab, 2 ), 2, '' );
		$title = Title::newFromText( trim( $pageName ) );
		if ( !$title ) {
			if ( empty( $tabName ) ) {
				$tabName = $pageName;
			}
			$tabBody = sprintf( '<div class="error">Invalid title: %s</div>', $pageName );
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
				// Add a link placeholder, as a fallback if JavaScript doesn't execute
				$linkRenderer = MediaWikiServices::getInstance()->getLinkRenderer();
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

				$utils = MediaWikiServices::getInstance()->getUrlUtils();
				$utils->expand( wfScript( 'api' ) . $query, PROTO_CANONICAL );

				$dataProps['load-url'] = $utils->expand( wfScript( 'api' ) . $query, PROTO_CANONICAL );
				$oldTabBody = $tabBody;
				// Allow extensions to update the lazy loaded tab
				MediaWikiServices::getInstance()->getHookContainer()->run(
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

		$tab = '<article class="tabber__panel" data-mw-tabber-title="' . htmlspecialchars( $tabName ) . '"';
		$tab .= implode( array_map( static function ( $prop, $value ) {
			return sprintf( ' data-mw-tabber-%s="%s"', $prop, htmlspecialchars( $value ) );
		}, array_keys( $dataProps ), $dataProps ) );
		$tab .= '>' . $tabBody . '</article>';
		$selected = false;

		return $tab;
	}
}
