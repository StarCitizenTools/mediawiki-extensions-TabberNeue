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

use JsonException;
use MediaWiki\MediaWikiServices;
use Parser;
use PPFrame;

class Tabber {
	/**
	 * Critical rendering styles
	 * See ext.tabberNeue.inline.less
	 *
	 * @var string
	 */
	public static $criticalInlineStyle = '.client-js .tabber__header{height:2.6em;box-shadow:inset 0 -1px 0 0;opacity:.1}.client-js .tabber__header:after{position:absolute;width:16ch;height:.5em;border-radius:40px;margin-top:1em;margin-left:.75em;background:#000;content:""}.client-js .tabber__noscript,.client-js .tabber__panel:not( :first-child ){display:none}';

	/**
	 * Flag that checks if this is a nested tabber
	 * @var bool
	 */
	private static $isNested = false;

	private static $useCodex = false;

	/**
	 * Parser callback for <tabber> tag
	 *
	 * @param string|null $input
	 * @param array $args
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string HTML
	 */
	public static function parserHook( ?string $input, array $args, Parser $parser, PPFrame $frame ) {
		self::$useCodex = MediaWikiServices::getInstance()->getMainConfig()->get( 'TabberNeueUseCodex' );

		$html = self::render( $input, $parser, $frame );

		if ( $input === null ) {
			return '';
		}

		if ( self::$useCodex === true ) {
			$parser->getOutput()->addModules( [ 'ext.tabberNeue.codex' ] );
		} else {
			// Critical rendering styles
			// See ext.tabberNeue.inline.less
			$style = sprintf( '<style id="tabber-style">%s</style>', self::$criticalInlineStyle );
			$parser->getOutput()->addHeadItem( $style, true );
			$parser->getOutput()->addModules( [ 'ext.tabberNeue.legacy' ] );
		}

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
	public static function render( string $input, Parser $parser, PPFrame $frame ): string {
		$arr = explode( '|-|', $input );
		$htmlTabs = '';
		foreach ( $arr as $tab ) {
			$htmlTabs .= self::buildTab( $tab, $parser, $frame );
		}

		if ( self::$useCodex && self::$isNested ) {
			$tab = rtrim( implode( '},', explode( '}', $htmlTabs ) ), ',' );
			$tab = strip_tags( html_entity_decode( $tab ) );
			$tab = str_replace( ',,', ',', $tab );
			$tab = str_replace( ',]', ']', $tab );

			return sprintf( '[%s]', $tab );
		}
		$htmlTabs = preg_replace( '/\\\n/', '', $htmlTabs );
		$htmlTabs = preg_replace( '/\\\*/', '', $htmlTabs );
		$htmlTabs = str_replace( [ '"[', ']"' ], [ '[', ']' ], $htmlTabs );

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
	 *
	 * @return string HTML
	 * @throws JsonException
	 */
	private static function buildTab( string $tab, Parser $parser, PPFrame $frame ): string {
		if ( empty( trim( $tab ) ) ) {
			return '';
		}
		// Use array_pad to make sure at least 2 array values are always returned
		[ $tabName, $tabBody ] = array_pad( explode( '=', $tab, 2 ), 2, '' );

		// Use language converter to get variant title and also escape html
		$tabName = $parser->getTargetLanguageConverter()->convertHtml( trim( $tabName ) );
		$tabBody = trim( $tabBody );

		// A nested tabber which should return json in codex
		if ( self::$useCodex && strpos( $tabBody, '{{#tag:tabber' ) !== false ) {
			self::$isNested = true;
			$tabBody = $parser->recursiveTagParse( $tabBody, $frame );
			self::$isNested = false;
		// The outermost tabber that must be parsed fully in codex for correct json
		} elseif ( self::$useCodex ) {
			$tabBody = $parser->recursiveTagParseFully( $tabBody, $frame );
		// Normal mode
		} else {
			$tabBody = $parser->recursiveTagParse( $tabBody, $frame );
		}

		if ( self::$useCodex && self::$isNested ) {
			return json_encode( [
				'label' => $tabName,
				'content' => $tabBody
			],
				JSON_THROW_ON_ERROR
			);
		}

		// If $tabBody does not have any HTML element (i.e. just a text node), wrap it in <p/>
		if ( $tabBody[0] !== '<' ) {
			$tabBody = '<p>' . $tabBody . '</p>';
		}

		return '<article class="tabber__panel" data-title="' . $tabName .
			'">' . $tabBody . '</article>';
	}
}
