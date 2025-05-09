<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Components;

class TabberComponentTab implements TabberComponent {
	public function __construct(
		private string $name,
		private string $label,
		private string $content,
		private bool $addTabPrefix
	) {
	}

	public function getTemplateData(): array {
		$id = $this->addTabPrefix ? "tabber-$this->name" : $this->name;

		return [
			'label' => $this->label,
			'content' => $this->content,
			'array-tab-attributes' => [
				[
					'key' => 'id',
					'value' => "$id-label"
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
