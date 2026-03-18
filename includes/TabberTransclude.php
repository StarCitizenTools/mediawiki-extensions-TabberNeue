<?php
/**
 * TabberNeue
 * TabberTransclude Class
 * Implement <tabbertransclude> tag
 *
 * @package TabberNeue
 * @author  alistair3149, Eric Fortin, Alexia E. Smith, Ciencia Al Poder
 * @license GPL-3.0-or-later
 * @link    https://www.mediawiki.org/wiki/Extension:TabberNeue
 */

declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue;

use Exception;
use MediaWiki\Extension\TabberNeue\DataModel\TabModel;
use MediaWiki\Extension\TabberNeue\Parsing\TabberTranscludeWikitextProcessor;
use MediaWiki\Extension\TabberNeue\Service\TabberRenderer;
use MediaWiki\Extension\TabberNeue\Service\TabIdGenerator;
use MediaWiki\Extension\TabberNeue\Service\TabParser;
use MediaWiki\HookContainer\HookContainer;
use MediaWiki\Html\Html;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;
use MediaWiki\Title\Title;

class TabberTransclude {

	public function __construct(
		private readonly TabberRenderer $renderer,
		private readonly TabParser $tabParser,
		private readonly TabIdGenerator $tabIdGenerator,
		private readonly HookContainer $hookContainer,
	) {
	}

	/**
	 * Parser callback for <tabbertransclude> tag
	 */
	public function parserHook( ?string $input, array $args, Parser $parser, PPFrame $frame ): string {
		if ( $input === null ) {
			return '';
		}

		return $this->render( $input, $args, $parser, $frame );
	}

	/**
	 * Renders the necessary HTML for a <tabbertransclude> tag.
	 */
	public function render( string $input, array $args, Parser $parser, PPFrame $frame ): string {
		$isCurrentlySelectedTab = true;

		$processor = new TabberTranscludeWikitextProcessor( $parser, $this->tabParser, $this->tabIdGenerator );
		$tabModels = $processor->process( $input );

		$resolvedModels = [];
		foreach ( $tabModels as $tabModel ) {
			$tabContent = '';
			try {
				$tabContent = $this->prepareTransclusionPanel(
					$tabModel->content,
					$parser,
					$frame,
					$isCurrentlySelectedTab
				);
			} catch ( Exception ) {
				$tabContent = Html::errorBox( 'Error processing tab: ' . $tabModel->label );
			}

			if ( $isCurrentlySelectedTab ) {
				$isCurrentlySelectedTab = false;
			}

			$resolvedModels[] = new TabModel( $tabModel->name, $tabModel->label, $tabContent );
		}

		return $this->renderer->render(
			$resolvedModels, $args, $parser, 'tabberneue-tabbertransclude-category'
		);
	}

	/**
	 * Build individual tab content HTML string.
	 *
	 * @throws Exception
	 */
	private function prepareTransclusionPanel(
		string $pageName,
		Parser $parser,
		PPFrame $frame,
		bool $isCurrentlySelectedTab,
	): string {
		$title = Title::newFromText( trim( $pageName ) );
		if ( !$title ) {
			// The error state is already handled in TabberTranscludeWikitextProcessor::parseTabContent()
			// TODO: This is not the best way to handle this.
			return $pageName;
		}

		$titleText = $title->getPrefixedText();
		$wikitext = sprintf( '{{:%s}}', $titleText );

		if ( $isCurrentlySelectedTab ) {
			$html = $parser->recursiveTagParseFully(
				$wikitext,
				$frame
			);
		} else {
			$innerContentHtml = $parser->getLinkRenderer()->makeLink( $title, null );

			// TODO: Should probably refactor this hook, not sure if it's used anywhere else.
			$originalinnerContentHtml = $innerContentHtml;

			$this->hookContainer->run(
				'TabberNeueRenderLazyLoadedTab',
				[ &$innerContentHtml, $parser, $frame ]
			);
			if ( $originalinnerContentHtml !== $innerContentHtml ) {
				$parser->getOutput()->recordOption( 'tabberneuelazyupdated' );
			}

			$html = Html::rawElement(
				'div',
				[
					'class' => 'tabber__transclusion',
					'data-mw-tabber-page' => $titleText,
					'data-mw-tabber-revision' => $title->getLatestRevID()
				],
				$innerContentHtml
			);
		}

		// TODO: There might be a cleaner way to do this.
		$revRecord = $parser->fetchCurrentRevisionRecordOfTitle( $title );
		$parser->getOutput()->addTemplate(
			$title,
			$title->getArticleId(),
			$revRecord?->getId() ?? 0
		);

		return $html;
	}
}
