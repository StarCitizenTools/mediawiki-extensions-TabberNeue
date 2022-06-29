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

use Parser;
use PPFrame;

class Tabber {
	/**
	 * Parser callback for <tabber> tag
	 *
	 * @param string $input
	 * @param array $args
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string HTML
	 */
	public static function parserHook( string $input, array $args, Parser $parser, PPFrame $frame ) {
		$tabber = new Tabber();
		$html = $tabber->render( $input, $parser, $frame );
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
		$parser->addTrackingCategory( 'tabberneue-tabber-category' );
		return $html;
	}

	/**
	 * Renders the necessary HTML for a <tabber> tag.
	 *
	 * @param string $input The input URL between the beginning and ending tags.
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string HTML
	 */
	public static function render( $input, Parser $parser, PPFrame $frame ) {
		$arr = explode( "|-|", $input );
		$htmlTabs = '';
		foreach ( $arr as $tab ) {
			$htmlTabs .= self::buildTab( $tab, $parser, $frame );
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
	 *
	 * @return string HTML
	 */
	private static function buildTab( $tab, Parser $parser, PPFrame $frame ) {
		if ( empty( trim( $tab ) ) ) {
			return '';
		}

		// Use array_pad to make sure at least 2 array values are always returned
		list( $tabName, $tabBody ) = array_pad( explode( '=', $tab, 2 ), 2, '' );

		$tabName = trim( $tabName );
		$tabBody = $parser->recursiveTagParse( $tabBody, $frame );

		$tab = '<article class="tabber__panel" title="' . htmlspecialchars( $tabName ) .
			'">' . $tabBody . '</article>';

		return $tab;
	}
}
