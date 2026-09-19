<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Components;

use MediaWiki\Parser\Sanitizer;

class TabberComponentTabs implements TabberComponent {

	/**
	 * Sanitizer::validateTagAttributes assumes its input already passed through
	 * Sanitizer::decodeTagAttributes, which lexes every name with this pattern.
	 * Its `data-` escape hatch excludes space, tab, CR and LF but not U+000C,
	 * which the HTML tokenizer also treats as an attribute separator — so a
	 * caller that supplies names directly rather than through the tag lexer can
	 * otherwise smuggle a second attribute into the name. Callers that bypass
	 * the lexer (Scribunto) must therefore be re-lexed here.
	 */
	private const ATTRIBUTE_NAME_REGEX = '/^[:_\p{L}\p{N}][:_.\-\p{L}\p{N}]*$/uD';

	public function __construct(
		private array $tabsData,
		private array $additionalAttributes,
		private bool $wrap = false
	) {
	}

	private function getAttributes(): array {
		$class = 'tabber tabber--init';
		if ( $this->wrap ) {
			$class .= ' tabber--wrap';
		}
		$attributes = [
			'class' => $class
		];

		foreach ( $this->additionalAttributes as $attribute => $value ) {
			$attribute = strtolower( (string)$attribute );
			if ( !preg_match( self::ATTRIBUTE_NAME_REGEX, $attribute ) ) {
				continue;
			}
			$attributes = Sanitizer::mergeAttributes( $attributes, [ $attribute => $value ] );
		}

		$attributes = Sanitizer::validateTagAttributes( $attributes, 'div' );

		return array_map(
			static fn ( $key, $value ) => [ 'key' => (string)$key, 'value' => $value ],
			array_keys( $attributes ),
			$attributes
		);
	}

	public function getTemplateData(): array {
		return [
			'array-tabs' => $this->tabsData,
			'array-attributes' => $this->getAttributes()
		];
	}
}
