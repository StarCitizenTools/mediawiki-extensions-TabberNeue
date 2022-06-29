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

use Wikimedia\Parsoid\Ext\ExtensionTagHandler;
use Wikimedia\Parsoid\Ext\ParsoidExtensionAPI;

class TabberParsoid extends ExtensionTagHandler {
	/** @inheritDoc */
	public function sourceToDom( ParsoidExtensionAPI $extApi, string $src, array $extArgs ) {
		$html = self::render( $extApi, $src );
		$extApi->addModules( [ 'ext.tabberNeue' ] );
		return $extApi->htmlToDom( $html );
	}

	/**
	 * Renders the necessary HTML for a <tabber> tag.
	 *
	 * @param PParsoidExtensionAPI $extApi
	 * @param string $src The input URL between the beginning and ending tags.
	 *
	 * @return string HTML
	 */
	public static function render( ParsoidExtensionAPI $extApi, string $src ) {
		$arr = explode( "|-|", $src );
		$htmlTabs = '';
		foreach ( $arr as $tab ) {
			$htmlTabs .= self::buildTab( $extApi, $tab );
		}

		$html = '<div class="tabber">' .
			'<section class="tabber__section">' . $htmlTabs . "</section></div>";

		return $html;
	}

	/**
	 * Build individual tab.
	 *
	 * @param PParsoidExtensionAPI $extApi
	 * @param string $tab Tab information
	 *
	 * @return string HTML
	 */
	private static function buildTab( ParsoidExtensionAPI $extApi, string $tab ) {
		if ( empty( trim( $tab ) ) ) {
			return '';
		}

		// Use array_pad to make sure at least 2 array values are always returned
		list( $tabName, $tabBody ) = array_pad( explode( '=', $tab, 2 ), 2, '' );

		$tabName = trim( $tabName );
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

		$tab = '<article class="tabber__panel" title="' . htmlspecialchars( $tabName ) .
			'">' . $tabBody . '</article>';

		return $tab;
	}
}
