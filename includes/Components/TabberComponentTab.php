<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Components;

use MediaWiki\Parser\Sanitizer;

class TabberComponentTab implements TabberComponent {
	public function __construct(
		private string $name,
		private string $label,
		private string $content,
		private bool $addTabPrefix
	) {
	}

	public function getTemplateData(): array {
		$name = Sanitizer::escapeIdForAttribute( $this->name );
		$id = $this->addTabPrefix ? "tabber-$name" : $name;

		return [
			'label' => $this->label,
			'content' => $this->content,
			'array-tab-attributes' => [
				[
					'key' => 'id',
					'value' => "$id-label"
				],
				[
					'key' => 'href',
					'value' => "#$id"
				],
				[
					'key' => 'aria-controls',
					'value' => $id
				]
			],
			'array-tabpanel-attributes' => [
				[
					'key' => 'id',
					'value' => $id
				],
				[
					'key' => 'aria-labelledby',
					'value' => "$id-label"
				]
			]
		];
	}
}
