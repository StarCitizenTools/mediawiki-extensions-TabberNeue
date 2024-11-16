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

use Html;
use JsonException;
use MediaWiki\MediaWikiServices;
use Parser;
use PPFrame;
use Sanitizer;

class Tabber {

	/** @var bool Flag that checks if this is a nested tabber */
	private static $isNested = false;

	/** @var bool */
	private static $useCodex = false;

	/** @var bool */
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
		$parserOutput = $parser->getOutput();

		self::$parseTabName = $config->get( 'TabberNeueParseTabName' );
		self::$useCodex = $config->get( 'TabberNeueUseCodex' );
		$count = count( $parserOutput->getExtensionData( 'tabber-count' ) ?? [] );

		$html = self::render( $input ?? '', $count, $parser, $frame );

		if ( $input === null ) {
			return '';
		}

		$parserOutput->appendExtensionData( 'tabber-count', $count++ );

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
	 * @param int $count Current Tabber count
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return string HTML
	 */
	public static function render( string $input, int $count, Parser $parser, PPFrame $frame ): string {
		$arr = explode( '|-|', $input );
		$tabs = '';
		$tabpanels = '';

		foreach ( $arr as $tab ) {
			$tabData = self::getTabData( $tab, $count, $parser, $frame );
			if ( $tabData === [] ) {
				continue;
			}

			if ( self::$useCodex && self::$isNested ) {
				$tabpanels .= self::getCodexNestedTabJSON( $tabData );
				continue;
			}

			$tabs .= self::getTabHTML( $tabData );
			$tabpanels .= self::getTabpanelHTML( $tabData );
		}

		if ( self::$useCodex && self::$isNested ) {
			$tabpanels = rtrim( implode( '},', explode( '}', $tabpanels ) ), ',' );
			$tabpanels = strip_tags( html_entity_decode( $tab ) );
			$tabpanels = str_replace( ',,', ',', $tabpanels );
			$tabpanels = str_replace( ',]', ']', $tabpanels );
			return sprintf( '[%s]', $tabpanels );
		}

		return "<div id='tabber-$count' class='tabber tabber--init'>" .
			'<header class="tabber__header"><button class="tabber__header__prev" aria-hidden="true"></button>' .
			'<nav class="tabber__tabs" role="tablist">' . $tabs . '</nav>' .
			'<button class="tabber__header__next" aria-hidden="true"></button></header>' .
			'<section class="tabber__section">' . $tabpanels . '</section></div>';
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

		if ( !self::$useCodex ) {
			$wikitextListMarkers = [ '*', '#', ';', ':' ];
			$isWikitextList = in_array( substr( $content, 0, 1 ), $wikitextListMarkers );
			if ( $isWikitextList ) {
				// Fix #151, some wikitext magic
				// Seems like there is no way to get rid of the mw-empty-elt paragraphs sadly
				$content = "\n$content\n";
			}
			return $parser->recursiveTagParse( $content, $frame );
		}

		// The outermost tabber that must be parsed fully in codex for correct json
		if ( strpos( $content, '{{#tag:tabber' ) === false ) {
			return $parser->recursiveTagParseFully( $content, $frame );
		}

		self::$isNested = true;
		$content = $parser->recursiveTagParse( $content, $frame );
		self::$isNested = false;
		return $content;
	}

	/**
	 * Get individual tab data from wikitext.
	 *
	 * @param string $tab tab wikitext
	 * @param int $count Current Tabber count
	 * @param Parser $parser Mediawiki Parser Object
	 * @param PPFrame $frame Mediawiki PPFrame Object
	 *
	 * @return array<string, string>
	 */
	private static function getTabData( string $tab, int $count, Parser $parser, PPFrame $frame ): array {
		$data = [];
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

		$id = Sanitizer::escapeIdForAttribute( htmlspecialchars( $data['label'] ) ) . '-' . $count;
		$data['id'] = $id;
		return $data;
	}

	/**
	 * Get the HTML for a tab.
	 *
	 * @param array $tabData Tab data
	 *
	 * @return string HTML
	 */
	private static function getTabHTML( array $tabData ): string {
		$tabpanelId = "tabber-tabpanel-{$tabData['id']}";
		return Html::rawElement( 'a', [
			'class' => 'tabber__tab',
			'id' => "tabber-tab-{$tabData['id']}",
			'href' => "#$tabpanelId",
			'role' => 'tab',
			'aria-controls' => $tabpanelId
		], $tabData['label'] );
	}

	/**
	 * Get the HTML for a tabpanel.
	 *
	 * @param array $tabData Tab data
	 *
	 * @return string HTML
	 */
	private static function getTabpanelHTML( array $tabData ): string {
		$content = $tabData['content'];
		$isContentHTML = strpos( $content, '<' ) === 0;
		if ( $content && !$isContentHTML ) {
			// If $content does not have any HTML element (i.e. just a text node), wrap it in <p/>
			$content = Html::rawElement( 'p', [], $content );
		}
		return Html::rawElement( 'article', [
			'class' => 'tabber__panel',
			'id' => "tabber-tabpanel-{$tabData['id']}",
			'role' => 'tabpanel',
			'tabindex' => 0,
			'aria-labelledby' => "tabber-tab-{$tabData['id']}"
		], $content );
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
