<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Components;

use MediaWiki\Parser\Sanitizer;

class TabberComponentTabs implements TabberComponent {
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
