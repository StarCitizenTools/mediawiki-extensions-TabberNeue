<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Components;

/**
 * @internal
 */
interface TabberComponent {
	public function getTemplateData(): array;
}
