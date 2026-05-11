<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\DataModel;

/**
 * Immutable identifier for a tab. Holds the canonical base name plus
 * the derived panel/label/fragment forms used in HTML output.
 *
 * The "tabber-" prefix decision is encapsulated here via the static
 * factory; callers must not branch on addTabPrefix themselves.
 */
class TabId {
	public function __construct(
		public readonly string $base,
		public readonly string $panelId,
		public readonly string $labelId,
		public readonly string $fragment
	) {
	}

	public static function build( string $base, bool $addTabPrefix ): self {
		$panelId = $addTabPrefix ? "tabber-$base" : $base;
		return new self(
			$base,
			$panelId,
			"$panelId-label",
			"#$panelId"
		);
	}
}
