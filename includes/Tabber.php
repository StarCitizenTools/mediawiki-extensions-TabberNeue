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
			$tabData = self::getTabData( $tab, $parser, $frame );
			if ( $tabData['label'] === '' ) {
				continue;
			}

			if ( self::$useCodex && self::$isNested ) {
				$htmlTabs .= self::getCodexNestedTabJSON( $tabData );
				continue;
			}

			$htmlTabs .= self::buildTabpanel( $tabData );
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
	 * Get parsed tab labels
	 *
	 * @param string $label tab label wikitext
	 * @param Parser $parser Mediawiki Parser Object
	 *
	 * @return string
	 */
	private static function getTabLabel( string $label, Parser $parser ): string {
		$label = trim( $label );
		if ( $label === '' ) {
			return '';
		}

		if ( !self::$parseTabName || self::$useCodex ) {
			// Only plain text is needed
			// Use language converter to get variant title and also escape html
			$label = $parser->getTargetLanguageConverter()->convertHtml( $label );
		} else {
			// Might contains HTML
			$label = $parser->recursiveTagParseFully( $label );
			$label = $parser->stripOuterParagraph( $label );
			$label = htmlentities( $label );
		}
		return $label;
	}

	/**
	 * Get parsed tab content
	 *
	 * @param string $content tab content wikitext
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string
	 */
	private static function getTabContent( string $content, Parser $parser, PPFrame $frame ): string {
		$content = trim( $content );
		if ( $content === '' ) {
			return '';
		}
		// Fix #151, some wikitext magic
		$content = "\n" . $content . "\n";
		if ( !self::$useCodex ) {
			$content = $parser->recursiveTagParse( $content, $frame );
		} else {
			// A nested tabber which should return json in codex
			if ( strpos( $content, '{{#tag:tabber' ) !== false ) {
				self::$isNested = true;
				$content = $parser->recursiveTagParse( $content, $frame );
				self::$isNested = false;
			// The outermost tabber that must be parsed fully in codex for correct json
			} else {
				$content = $parser->recursiveTagParseFully( $content, $frame );
			}
		}
		return $content;
	}

	/**
	 * Get individual tab data from wikitext.
	 *
	 * @param string $tab tab wikitext
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return array<string, string>
	 */
	private static function getTabData( string $tab, Parser $parser, PPFrame $frame ): array {
		$data = [
			'label' => '',
			'content' => ''
		];
		if ( empty( trim( $tab ) ) ) {
			return $data;
		}
		// Use array_pad to make sure at least 2 array values are always returned
		[ $label, $content ] = array_pad( explode( '=', $tab, 2 ), 2, '' );

		$data['label'] = self::getTabLabel( $label, $parser );
		// Label is empty, we cannot generate tabber
		if ( $data['label'] === '' ) {
			return $data;
		}

		$data['content'] = self::getTabContent( $content, $parser, $frame );
		return $data;
	}

	/**
	 * Build individual tabpanel.
	 *
	 * @param array $tabData Tab data
	 *
	 * @return string HTML
	 */
	private static function buildTabpanel( array $tabData ): string {
		$label = $tabData['label'];
		$content = $tabData['content'];

		$isContentHTML = strpos( $content, '<' ) === 0;
		if ( $content && !$isContentHTML ) {
			// If $content does not have any HTML element (i.e. just a text node), wrap it in <p/>
			$content = '<p>' . $content . '</p>';
		}

		return '<article class="tabber__panel" data-mw-tabber-title="' . $label .
		'">' . $content . "</article>";
	}

	/**
	 * Get JSON representation of a nested tab for Codex
	 *
	 * @param array $tabData Tab data
	 *
	 * @return string HTML
	 * @throws JsonException
	 */
	private static function getCodexNestedTabJSON( array $tabData ): string {
		// A nested tabber which should return json in codex
		return json_encode( [
			'label' => $tabData['label'],
			'content' => $tabData['content']
		],
			JSON_THROW_ON_ERROR
		);
	}
}
