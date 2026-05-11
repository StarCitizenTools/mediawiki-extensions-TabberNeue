<?php
/**
 * TabberNeue
 * TabberHandler Class
 * Implement <tabber> tag
 *
 * @package TabberNeue
 * @author  alistair3149, Eric Fortin, Alexia E. Smith, Ciencia Al Poder
 * @license GPL-3.0-or-later
 * @link    https://www.mediawiki.org/wiki/Extension:TabberNeue
 */

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Handlers;

use MediaWiki\Extension\TabberNeue\Parsing\TabberWikitextProcessor;
use MediaWiki\Extension\TabberNeue\Parsing\TabSegmentSplitter;
use MediaWiki\Extension\TabberNeue\Service\TabberRenderer;
use MediaWiki\Extension\TabberNeue\Service\TabModelBuilder;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;

class TabberHandler {

	public function __construct(
		private readonly TabberRenderer $renderer,
		private readonly TabSegmentSplitter $splitter,
		private readonly TabModelBuilder $tabModelBuilder
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
			$this->splitter,
			$this->tabModelBuilder
		);

		$tabModels = $processor->process( $input );

		return $this->renderer->render( $tabModels, $args, $parser );
	}
}
