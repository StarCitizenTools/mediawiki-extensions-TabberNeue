<?php

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Scribunto;

use MediaWiki\Extension\Scribunto\Engines\LuaCommon\LibraryBase;
use MediaWiki\Extension\Scribunto\Engines\LuaCommon\LuaError;
use MediaWiki\MediaWikiServices;

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

	/**
	 * Render tabber from Lua data.
	 *
	 * @param mixed $tabData Tab data from Lua.
	 * @return array
	 * @throws LuaError If the tab data is invalid.
	 */
	public function render( $tabData = null ): array {
		$this->checkType( 'mw.ext.tabber.render', 1, $tabData, 'table' );

		$parser = $this->getParser();
		$services = $this->getServices();

		$tabModels = [];
		foreach ( $tabData as $tab ) {
			if ( !is_array( $tab ) || !isset( $tab['label'] ) || !isset( $tab['content'] ) ) {
				throw new LuaError( 'Tab must be an array with label and content keys' );
			}
			if ( !is_string( $tab['label'] ) || !is_string( $tab['content'] ) ) {
				throw new LuaError( 'Tab label and content must be strings' );
			}

			$tabModel = $services->tabModelBuilder->build( $tab['label'], $tab['content'], $parser );
			if ( $tabModel !== null ) {
				$tabModels[] = $tabModel;
			}
		}

		if ( $tabModels === [] ) {
			return [ '' ];
		}

		$html = $services->tabberRenderer->render( $tabModels, [], $parser );
		// Wrap in strip marker to prevent parser from double-processing the HTML.
		return [ $parser->insertStripItem( $html ) ];
	}

	private function getServices(): LuaServices {
		$mw = MediaWikiServices::getInstance();
		return new LuaServices(
			$mw->getService( 'TabberNeue.TabModelBuilder' ),
			$mw->getService( 'TabberNeue.TabberRenderer' )
		);
	}
}
