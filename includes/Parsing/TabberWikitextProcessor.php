<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Parsing;

use MediaWiki\Config\Config;
use MediaWiki\Extension\TabberNeue\DataModel\TabModel;
use MediaWiki\Html\Html;
use MediaWiki\Parser\Parser;
use MediaWiki\Parser\PPFrame;
use MediaWiki\Parser\Sanitizer;

class TabberWikitextProcessor implements WikitextProcessor {
    public function __construct(
        private Parser $parser,
        private PPFrame $frame,
        private Config $config
    ) {
    }

    /**
     * Processes the raw wikitext input for tabber.
     * Returns an array of TabModel objects on success, or an HTML string on error.
     *
     * @return TabModel[]
     */
    public function process( string $wikitext ): array {
        $tabModels = [];

        $segments = explode( '|-|', $wikitext );
        foreach ( $segments as $segment ) {
            if ( empty( trim( $segment ) ) ) {
                continue;
            }

			$tabModel = $this->parseTabSegment( $segment );
			if ( $tabModel !== null ) {
				$tabModels[] = $tabModel;
			}
        }

        return $tabModels;
    }

    /**
     * Parses a single tab segment (label=content).
     */
    private function parseTabSegment( string $tabSegment ): ?TabModel {
        [ $rawLabel, $rawContent ] = array_pad( explode( '=', $tabSegment, 2 ), 2, '' );

        $label = $this->parseTabLabel( $rawLabel );
        if ( $label === '' ) {
            return null;
        }

        $isContentHTML = strpos( $rawContent, '<' ) === 0;
        $content = $this->parseTabContent( $rawContent );

        if ( $content !== '' && !$isContentHTML ) {
            $content = Html::rawElement( 'p', [], $content );
        }

        return new TabModel( $this->getName( $label ), $label, $content );
    }

	private function getName( string $label ): string {
		// Tab name can contain HTML
		if ( $this->config->get( 'TabberNeueParseTabName' ) ) {
			$label = htmlspecialchars( $label );
		}

		return $this->getUniqueName( Sanitizer::escapeIdForAttribute( $label ) );
    }

	private function getUniqueName( string $name ): string {
		$parserOutput = $this->parser->getOutput();
		$existingIds = $parserOutput->getExtensionData( 'tabber-ids' ) ?? [];

        if ( isset( $existingIds[ $name ] ) ) {
			$count = $existingIds[ $name ] + 1;
			$name = $name . '_' . $count; // Same pattern as duplicated headings in MediaWiki
			/*
			// TODO: Useful when we implement custom tab IDs
            throw new InvalidArgumentException(
                $this->parser->msg( 'tabberneue-error-tabs-duplicate-label', $name )->text()
            );
			*/
        } else {
			$count = 1;
		}

		$existingIds[ $name ] = $count;
		$parserOutput->setExtensionData( 'tabber-ids', $existingIds );

		return $name;
	}

    /**
     * Parses the tab label.
     */
    private function parseTabLabel( string $labelWikitext ): string {
        $label = trim( $labelWikitext );
        if ( $label === '' ) {
            return '';
        }

        if ( !$this->config->get( 'TabberNeueParseTabName' ) ) {
            $label = $this->parser->getTargetLanguageConverter()->convertHtml( $label );
        } else {
            $label = $this->parser->recursiveTagParseFully( $label );
            $label = $this->parser->stripOuterParagraph( $label );
        }
        return $label;
    }

    /**
     * Parses the tab content.
     */
    private function parseTabContent( string $contentWikitext ): string {
        $content = trim( $contentWikitext );
        if ( $content === '' ) {
            return '';
        }

        $wikitextCharacters = [ '*', '#', ';', ':', '[' ];
        if ( in_array( substr( $content, 0, 1 ), $wikitextCharacters, true ) ) {
            $content = "\n$content\n";
        }
        return $this->parser->recursiveTagParse( $content, $this->frame );
    }
}
