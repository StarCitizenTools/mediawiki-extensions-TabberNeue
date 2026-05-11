<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\DataModel;

class TabModel {
	public function __construct(
		public readonly TabId $id,
		public readonly string $label,
		public readonly string $content
	) {
	}
}
