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
		// TODO: Check Parsoid support
	}
}
