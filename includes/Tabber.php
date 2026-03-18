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

use MediaWiki\Extension\TabberNeue\Parsing\TabberWikitextProcessor;
use MediaWiki\Extension\TabberNeue\Service\TabberRenderer;
use MediaWiki\Extension\TabberNeue\Service\TabIdGenerator;
use MediaWiki\Extension\TabberNeue\Service\TabParser;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;

class Tabber {

	public function __construct(
		private readonly TabberRenderer $renderer,
		private readonly TabParser $tabParser,
		private readonly TabIdGenerator $tabIdGenerator
	) {
	}

	/**
	 * Parser callback for <tabber> tag
	 */
	public function parserHook( ?string $input, array $args, Parser $parser, PPFrame $frame ): string {
		if ( $input === null ) {
			return '';
		}

		return $this->render( $input, $args, $parser, $frame );
	}

	/**
	 * Renders the necessary HTML for a <tabber> tag.
	 */
	public function render( string $input, array $args, Parser $parser, PPFrame $frame ): string {
		$processor = new TabberWikitextProcessor(
			$parser,
			$frame,
			$this->tabParser,
			$this->tabIdGenerator
		);

		$tabModels = $processor->process( $input );

		return $this->renderer->render( $tabModels, $args, $parser );
	}
}
