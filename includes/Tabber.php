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
	 * Flag that checks if this is a nested tabber
	 * @var bool
	 */
	private static $isNested = false;

	private static $useCodex = false;

	private static $parseTabName = false;

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
		$config = MediaWikiServices::getInstance()->getMainConfig();
		self::$parseTabName = $config->get( 'TabberNeueParseTabName' );
		self::$useCodex = $config->get( 'TabberNeueUseCodex' );

		$html = self::render( $input ?? '', $parser, $frame );

		if ( $input === null ) {
			return '';
		}

		if ( self::$useCodex === true ) {
			$parser->getOutput()->addModules( [ 'ext.tabberNeue.codex' ] );
		} else {
			$parser->getOutput()->addModuleStyles( [ 'ext.tabberNeue.init.styles' ] );
			$parser->getOutput()->addModules( [ 'ext.tabberNeue' ] );
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

		$tabName = trim( $tabName );
		// Fix #151
		$tabBody = "\n" . trim( $tabBody );

		// Codex mode
		if ( self::$useCodex ) {
			// Use language converter to get variant title and also escape html
			$tabName = $parser->getTargetLanguageConverter()->convertHtml( $tabName );
			// A nested tabber which should return json in codex
			if ( strpos( $tabBody, '{{#tag:tabber' ) !== false ) {
				self::$isNested = true;
				$tabBody = $parser->recursiveTagParse( $tabBody, $frame );
				self::$isNested = false;
			// The outermost tabber that must be parsed fully in codex for correct json
			} else {
				$tabBody = $parser->recursiveTagParseFully( $tabBody, $frame );
			}

			if ( self::$isNested ) {
				return json_encode( [
					'label' => $tabName,
					'content' => $tabBody
				],
					JSON_THROW_ON_ERROR
				);
			}
		}

		// Normal mode
		if ( self::$parseTabName ) {
			$tabName = $parser->recursiveTagParseFully( $tabName );
			$tabName = $parser->stripOuterParagraph( $tabName );
			$tabName = htmlentities( $tabName );
		} else {
			$tabName = $parser->getTargetLanguageConverter()->convertHtml( $tabName );
		}
		$tabBody = $parser->recursiveTagParse( $tabBody, $frame );

		// If $tabBody does not have any HTML element (i.e. just a text node), wrap it in <p/>
		if ( $tabBody && $tabBody[0] !== '<' ) {
			$tabBody = '<p>' . $tabBody . '</p>';
		}

		// \n is needed for #151
		return '<article class="tabber__panel" data-mw-tabber-title="' . $tabName .
		'">' . $tabBody . "</article>\n";
	}
}
