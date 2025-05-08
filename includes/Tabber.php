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

use InvalidArgumentException;
use MediaWiki\Html\TemplateParser;
use MediaWiki\Html\Html;
use MediaWiki\MediaWikiServices;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;
use MediaWiki\Parser\Sanitizer;

class Tabber {

	/** @var bool */
	private static $parseTabName = false;

	/** @var bool */
	private static $useLegacyId = false;

	/**
	 * Parser callback for <tabber> tag
	 */
	public static function parserHook( ?string $input, array $args, Parser $parser, PPFrame $frame ): string {
		if ( $input === null ) {
			return '';
		}

		$config = MediaWikiServices::getInstance()->getMainConfig();
		$parserOutput = $parser->getOutput();

		self::$parseTabName = $config->get( 'TabberNeueParseTabName' );
		self::$useLegacyId = $config->get( 'TabberNeueUseLegacyTabIds' );

		$count = count( $parserOutput->getExtensionData( 'tabber-count' ) ?? [] );
		$parserOutput->appendExtensionData( 'tabber-count', $count + 1 );

		$html = self::render( $input, $count, $args, $parser, $frame );

		$parserOutput->addModuleStyles( [ 'ext.tabberNeue.init.styles' ] );
		$parserOutput->addModules( [ 'ext.tabberNeue' ] );

		$parser->addTrackingCategory( 'tabberneue-tabber-category' );
		return $html;
	}

	/**
	 * Renders the necessary HTML for a <tabber> tag.
	 */
	public static function render( string $input, int $count, array $args, Parser $parser, PPFrame $frame ): string {
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

		$arr = explode( '|-|', $input );
		foreach ( $arr as $tab ) {
			$tabData = self::getTabData( $tab, $count, $parser, $frame );
			if ( $tabData === [] ) {
				continue;
			}

			$data['array-tabs'][] = [
				'content' => $tabData['content'],
				'label' => $tabData['label'],
				'tabId' => "tabber-tab-{$tabData['id']}",
				'tabpanelId' => self::$useLegacyId ? $tabData['id'] : "tabber-tabpanel-{$tabData['id']}"
			];
		}

		$templateParser = new TemplateParser( __DIR__ . '/templates' );
		return $templateParser->processTemplate( 'Tabber', $data );
	}

	/**
	 * Get parsed tab labels
	 */
	private static function getTabLabel( string $label, Parser $parser ): string {
		$label = trim( $label );
		if ( $label === '' ) {
			return '';
		}

		if ( !self::$parseTabName ) {
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
	 */
	private static function getTabContent( string $content, Parser $parser, PPFrame $frame ): string {
		$content = trim( $content );
		if ( $content === '' ) {
			return '';
		}

		// Insert a new line for these characters in wikitext (#151)
		// Seems like there is no way to get rid of the mw-empty-elt paragraphs sadly
		$wikitextCharacters = [ '*', '#', ';', ':', '[' ];
		$needsNewLine = in_array( substr( $content, 0, 1 ), $wikitextCharacters );
		if ( $needsNewLine ) {
			$content = "\n$content\n";
		}
		return $parser->recursiveTagParse( $content, $frame );
	}

	/**
	 * Get individual tab data from wikitext.
	 *
	 * @throws MWException
	 */
	private static function getTabData( string $tab, int $count, Parser $parser, PPFrame $frame ): array {
		if ( empty( trim( $tab ) ) ) {
			return [];
		}

		// Use array_pad to make sure at least 2 array values are always returned
		[ $label, $content ] = array_pad( explode( '=', $tab, 2 ), 2, '' );

		$label = self::getTabLabel( $label, $parser );
		// Label is empty, we cannot generate tabber
		if ( $label === '' ) {
			return [];
		}

		$isContentHTML = strpos( $content, '<' ) === 0;
		$content = self::getTabContent( $content, $parser, $frame );

		if ( $content && !$isContentHTML ) {
			// If $content does not have any HTML element (i.e. just a text node), wrap it in <p/>
			$content = Html::rawElement( 'p', [], $content );
		}

		if ( !self::$parseTabName ) {
			// plain text label has already been passed through 'htmlspecialchars' in 'convertHtml' of 'getTabLabel'
			$id = Sanitizer::escapeIdForAttribute( $label );
		} else {
			$id = Sanitizer::escapeIdForAttribute( htmlspecialchars( $label ) );
		}

		if ( self::$useLegacyId === true ) {
			$parserOutput = $parser->getOutput();
			$existingIds = $parserOutput->getExtensionData( 'tabber-ids' ) ?? [];
			if ( in_array( $id, $existingIds ) ) {
				throw new InvalidArgumentException(
					'Duplicated Tabber labels is not allowed with $wgTabberNeueUseLegacyTabIds = true.' .
					'Label was: ' . $label
				);
			}
			$parserOutput->appendExtensionData( 'tabber-ids', $id );
		} else {
			$id = "$id-$count";
		}

		return [
			'label' => $label,
			'content' => $content,
			'id' => $id
		];
	}
}
