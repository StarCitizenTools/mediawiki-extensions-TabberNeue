<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Components;

use MediaWiki\Extension\TabberNeue\DataModel\TabId;

class TabberComponentTab implements TabberComponent {
	public function __construct(
		private readonly TabId $id,
		private readonly string $label,
		private readonly string $content
	) {
	}

	public function getTemplateData(): array {
		return [
			'label' => $this->label,
			'content' => $this->content,
			'array-tab-attributes' => [
				[ 'key' => 'id', 'value' => $this->id->labelId ],
				[ 'key' => 'href', 'value' => $this->id->fragment ],
				[ 'key' => 'aria-controls', 'value' => $this->id->panelId ],
			],
			'array-tabpanel-attributes' => [
				[ 'key' => 'id', 'value' => $this->id->panelId ],
				[ 'key' => 'aria-labelledby', 'value' => $this->id->labelId ],
			],
		];
	}
}
