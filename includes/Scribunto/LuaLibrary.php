<?php

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Scribunto;

use MediaWiki\Extension\Scribunto\Engines\LuaCommon\LibraryBase;
use MediaWiki\Extension\Scribunto\Engines\LuaCommon\LuaError;

class LuaLibrary extends LibraryBase {

	/**
	 * @inheritDoc
	 */
	public function register(): array {
		$lib = [
			'render' => [ $this, 'render' ],
		];

		return $this->getEngine()->registerInterface( __DIR__ . DIRECTORY_SEPARATOR . 'mw.ext.tabber.lua', $lib, [] );
	}

	public function render( $tabData = null ): array {
		$this->checkType( 'mw.ext.tabber.render', 1, $tabData, 'table' );

		// TODO: We should pass the data directly to the Tabber classes.
		// Instead of converting to wikitext and then parsing it again.
		$wikitext = $this->convertToWikitext( $tabData );

		return [ $this->getParser()->recursiveTagParse( $wikitext ) ];
	}

	/**
	 * @throws LuaError If the tab data is invalid.
	 */
	private function convertToWikitext( array $tabData ) {
		$wikitext = '';
		foreach ( $tabData as $tab ) {
			if ( !is_array( $tab ) || !isset( $tab['label'], $tab['content'] ) ) {
				throw new LuaError( 'Tab must be an array with label and content keys' );
			}

			if ( !is_string( $tab['label'] ) || !is_string( $tab['content'] ) ) {
				throw new LuaError( 'Tab label and content must be strings' );
			}

			$wikitext .= '{{!}}-{{!}}' . $tab['label'] . '=' . $tab['content'];
		}

		if ( $wikitext === '' ) {
			return '';
		}

		return '{{#tag:tabber|' . $wikitext . '}}';
	}
}
