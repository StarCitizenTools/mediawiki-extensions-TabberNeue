<?php
/**
 * TabberNeue
 * TabberNeue Hooks Class
 *
 * @package TabberNeue
 * @author  alistair3149, Eric Fortin, Alexia E. Smith, Ciencia Al Poder
 * @license GPL-3.0-or-later
 * @link    https://www.mediawiki.org/wiki/Extension:TabberNeue
 */

declare( strict_types=1 );

namespace TabberNeue;

use Hooks;
use MediaWiki\MediaWikiServices;
use Parser;
use PPFrame;
use Title;

class TabberNeueHooks {
	/**
	 * Sets up this extension's parser functions.
	 *
	 * @param Parser $parser Parser object passed as a reference.
	 */
	public static function onParserFirstCallInit( Parser $parser ) {
		$parser->setHook( 'tabber', [ __CLASS__, 'renderTabber' ] );
		$parser->setHook( 'tabbertransclude', [ __CLASS__, 'renderTabberTransclude' ] );
	}

	/**
	 * Renders the necessary HTML for a <tabber> tag.
	 *
	 * @param string $input The input URL between the beginning and ending tags.
	 * @param array $args Array of attribute arguments on that beginning tag.
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string HTML
	 */
	public static function renderTabber( $input, array $args, Parser $parser, PPFrame $frame ) {
		$parser->getOutput()->addModules( [ 'ext.tabberNeue' ] );
		if ( $input === null ) {
			return;
		}
		$arr = explode( "|-|", $input );
		$htmlTabs = '';
		foreach ( $arr as $tab ) {
			$htmlTabs .= self::buildTab( $tab, $parser, $frame );
		}

		$html = '<div class="tabber">' .
			'<section class="tabber__section">' . $htmlTabs . "</section></div>";

		return $html;
	}

	/**
	 * Build individual tab.
	 *
	 * @param string $tab Tab information
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string HTML
	 */
	private static function buildTab( $tab, Parser $parser, PPFrame $frame ) {
		$tab = trim( $tab );
		if ( empty( $tab ) ) {
			return $tab;
		}

		// Use array_pad to make sure at least 2 array values are always returned
		list( $tabName, $tabBody ) = array_pad( array_map( 'trim', explode( '=', $tab, 2 ) ), 2, '' );

		$tabBody = $parser->recursiveTagParseFully( $tabBody, $frame );

		$tab = '<article class="tabber__panel" title="' . htmlspecialchars( $tabName ) .
			'">' . $tabBody . '</article>';

		return $tab;
	}

	/**
	 * Renders the necessary HTML for a <tabbertransclude> tag.
	 *
	 * @param string $input The input URL between the beginning and ending tags.
	 * @param array $args Array of attribute arguments on that beginning tag.
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string HTML
	 */
	public static function renderTabberTransclude( $input, array $args, Parser $parser, PPFrame $frame ) {
		$parser->getOutput()->addModules( [ 'ext.tabberNeue' ] );
		$selected = true;

		if ( $input === null ) {
			return;
		}
		$arr = explode( "\n", $input );
		$htmlTabs = '';
		foreach ( $arr as $tab ) {
			$htmlTabs .= self::buildTabTransclude( $tab, $parser, $frame, $selected );
		}

		$html = '<div class="tabber">' .
			'<section class="tabber__section">' . $htmlTabs . "</section></div>";

		return $html;
	}

	/**
	 * Build individual tab.
	 *
	 * @param string $tab Tab information
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 * @param bool $selected The tab is the selected one
	 *
	 * @return string HTML
	 */
	private static function buildTabTransclude( $tab, Parser $parser, PPFrame $frame, &$selected ) {
		$tab = trim( $tab );
		if ( empty( $tab ) ) {
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
