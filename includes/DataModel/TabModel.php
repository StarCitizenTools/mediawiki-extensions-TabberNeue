<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\DataModel;

class TabModel {
	public function __construct(
		public string $name,
		public string $label,
		public string $content
	) {
	}
}
