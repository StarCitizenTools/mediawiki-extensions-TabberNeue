<?php

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Scribunto;

use MediaWiki\Extension\Scribunto\Engines\LuaCommon\LibraryBase;
use MediaWiki\Extension\Scribunto\Engines\LuaCommon\LuaError;
use MediaWiki\Extension\TabberNeue\DataModel\TabModel;
use MediaWiki\Extension\TabberNeue\Service\TabIdGenerator;
use MediaWiki\Extension\TabberNeue\Service\TabParser;
use MediaWiki\Extension\TabberNeue\Service\TabberRenderer;
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
		$parserOutput = $parser->getOutput();
		$tabParser = $this->getTabParser();
		$tabIdGenerator = $this->getTabIdGenerator();

		$tabModels = [];
		foreach ( $tabData as $tab ) {
			if ( !is_array( $tab ) || !isset( $tab['label'] ) || !isset( $tab['content'] ) ) {
				throw new LuaError( 'Tab must be an array with label and content keys' );
			}

			if ( !is_string( $tab['label'] ) || !is_string( $tab['content'] ) ) {
				throw new LuaError( 'Tab label and content must be strings' );
			}

			$label = $tabParser->parseLabel( $tab['label'], $parser );
			if ( $label === '' ) {
				continue;
			}

			$content = $tabParser->parseContent( $tab['content'], $parser );

			$baseId = $tabIdGenerator->generateSanitizedId( $label );
			$uniqueName = $tabIdGenerator->ensureUniqueId( $baseId, $parserOutput );
			$tabModels[] = new TabModel( $uniqueName, $label, $content );
		}

		if ( $tabModels === [] ) {
			return [ '' ];
		}

		$html = $this->getTabberRenderer()->render( $tabModels, [], $parser );

		// Wrap in strip marker to prevent parser from double-processing the HTML
		return [ $parser->insertStripItem( $html ) ];
	}

	private function getTabParser(): TabParser {
		return MediaWikiServices::getInstance()->getService( 'TabberNeue.TabParser' );
	}

	private function getTabIdGenerator(): TabIdGenerator {
		return MediaWikiServices::getInstance()->getService( 'TabberNeue.TabIdGenerator' );
	}

	private function getTabberRenderer(): TabberRenderer {
		return MediaWikiServices::getInstance()->getService( 'TabberNeue.TabberRenderer' );
	}
}
