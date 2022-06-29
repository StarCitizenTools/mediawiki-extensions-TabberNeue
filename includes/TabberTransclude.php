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

use Hooks;
use MediaWiki\MediaWikiServices;
use Parser;
use PPFrame;
use Title;

class TabberTransclude {
	/**
	 * Parser callback for <tabbertransclude> tag
	 *
	 * @param string $input
	 * @param array $args
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string HTML
	 */
	public static function parserHook( string $input, array $args, Parser $parser, PPFrame $frame ) {
		$tabberTransclude = new TabberTransclude();
		$html = $tabberTransclude->render( $input, $parser, $frame );
		if ( $input === null ) {
			return;
		}
		// Critial rendering styles
		// See ext.tabberNeue.inline.less
		$style = sprintf(
			'<style id="tabber-style">%s</style>',
			'.tabber__header{height:2.6em;box-shadow:inset 0-1px 0 0;opacity:0.1}.tabber__header:after{position:absolute;width:16ch;height:0.5em;margin-top:1em;margin-left:0.75em;background:#000;border-radius:40px;content:""}.tabber__panel:not(:first-child){display:none}'
		);
		$parser->getOutput()->addHeadItem( $style, true );
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
	public static function render( $input, Parser $parser, PPFrame $frame ) {
		$selected = true;
		$arr = explode( "\n", $input );
		$htmlTabs = '';
		foreach ( $arr as $tab ) {
			$htmlTabs .= self::buildTabTransclude( $tab, $parser, $frame, $selected );
		}

		$noscriptMsg = wfMessage( 'tabberneue-noscript' )->text();
		$html = '<div class="tabber">' .
			'<header class="tabber__header"><noscript>' . $noscriptMsg . '</noscript></header>' .
			'<section class="tabber__section">' . $htmlTabs . '</section></div>';

		return $html;
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
	 */
	private static function buildTabTransclude( $tab, Parser $parser, PPFrame $frame, &$selected ) {
		if ( empty( trim( $tab ) ) ) {
			return '';
		}

		$tabBody = '';
		$dataProps = [];
		// Use array_pad to make sure at least 2 array values are always returned
		list( $pageName, $tabName ) = array_pad( explode( '|', $tab, 2 ), 2, '' );
		$title = Title::newFromText( trim( $pageName ) );
		if ( !$title ) {
			if ( empty( $tabName ) ) {
				$tabName = $pageName;
			}
			$tabBody = sprintf( '<div class="error">Invalid title: %s</div>', $pageName );
			$pageName = '';
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
				$dataProps['pending-load'] = '1';
				// 1.37: $currentTitle = $parser->getPage();
				$currentTitle = $parser->getTitle();
				$query = sprintf(
					'?action=parse&format=json&formatversion=2&title=%s&text={{:%s}}&redirects=1&prop=text&disablelimitreport=1&disabletoc=1&wrapoutputclass=',
					urlencode( $currentTitle->getPrefixedText() ),
					urlencode( $pageName )
				);
				$dataProps['load-url'] = wfExpandUrl( wfScript( 'api' ) . $query,  PROTO_CANONICAL );
				$oldTabBody = $tabBody;
				// Allow extensions to update the lazy loaded tab
				Hooks::run( 'TabberNeueRenderLazyLoadedTab', [ &$tabBody, &$dataProps, $parser, $frame ] );
				if ( $oldTabBody != $tabBody ) {
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

		$tab = '<article class="tabber__panel" title="' . htmlspecialchars( $tabName ) . '"';
		$tab .= implode( array_map( static function ( $prop, $value ) {
			return sprintf( ' data-tabber-%s="%s"', $prop, htmlspecialchars( $value ) );
		}, array_keys( $dataProps ), $dataProps ) );
		$tab .= '>' . $tabBody . '</article>';
		$selected = false;

		return $tab;
	}
}
