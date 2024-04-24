<?php
/**
 * TabberNeue
 * TabberParsoid Class
 * Implement <tabber> tag in Parsoid
 *
 * @package TabberNeue
 * @author  alistair3149, Eric Fortin, Alexia E. Smith, Ciencia Al Poder
 * @license GPL-3.0-or-later
 * @link    https://www.mediawiki.org/wiki/Extension:TabberNeue
 */

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue;

use Wikimedia\Parsoid\Ext\ExtensionModule;
use Wikimedia\Parsoid\Ext\ExtensionTagHandler;
use Wikimedia\Parsoid\Ext\ParsoidExtensionAPI;

class TabberParsoid extends ExtensionTagHandler implements ExtensionModule {
	/** @inheritDoc */
	public function getConfig(): array {
		return [
			'name' => 'TabberNeue',
			'tags' => [
				[
					'name' => 'tabber',
					'handler' => self::class
				]
			]
		];
	}

	/** @inheritDoc */
	public function sourceToDom( ParsoidExtensionAPI $extApi, string $src, array $extArgs ) {
		$html = self::render( $extApi, $src );
		$extApi->getMetadata()->addModules( [ 'ext.tabberNeue.codex' ] );
		return $extApi->htmlToDom( $html );
	}

	/**
	 * Renders the necessary HTML for a <tabber> tag.
	 *
	 * @param ParsoidExtensionAPI $extApi
	 * @param string $src The input URL between the beginning and ending tags.
	 *
	 * @return string HTML
	 */
	public static function render( ParsoidExtensionAPI $extApi, string $src ): string {
		$arr = explode( '|-|', $src );
		$htmlTabs = '';
		foreach ( $arr as $tab ) {
			$htmlTabs .= self::buildTab( $extApi, $tab );
		}

		return '<div class="tabber">' .
			'<header class="tabber__header"></header>' .
			'<section class="tabber__section">' . $htmlTabs . "</section></div>";
	}

	/**
	 * Build individual tab.
	 *
	 * @param ParsoidExtensionAPI $extApi
	 * @param string $tab Tab information
	 *
	 * @return string HTML
	 */
	private static function buildTab( ParsoidExtensionAPI $extApi, string $tab ): string {
		if ( empty( trim( $tab ) ) ) {
			return '';
		}

		// Use array_pad to make sure at least 2 array values are always returned
		[ $tabName, $tabBody ] = array_pad( explode( '=', $tab, 2 ), 2, '' );

		/*
		 * Use language converter to get variant title and also escape html
		 * FIXME: No replacement method yet
		 * See T85581, T272943
		*/
		// $tabName = $parser->getTargetLanguageConverter()->convertHtml( trim( $tabName ) );
		$tabBody = $extApi->domToHTML(
			$extApi->wikitextToDOM(
				$tabBody,
				[
					'parseOpts' => [
						'extTag' => 'tabber',
						'context' => 'inline',
					]
				],
				true // sol
			)
		);

		return '<article class="tabber__panel" title="' . $tabName .
			'">' . $tabBody . '</article>';
	}
}
