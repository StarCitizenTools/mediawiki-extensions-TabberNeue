<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\DataModel;

use MediaWiki\Title\Title;

/**
 * Result of resolving a tabbertransclude page-name to a Title.
 * Either holds a valid Title (success) or an HTML error box string
 * suitable for direct use as tab content (error).
 */
class TransclusionTitleResult {
	private function __construct(
		private readonly ?Title $title,
		private readonly ?string $errorBox
	) {
	}

	public static function success( Title $title ): self {
		return new self( $title, null );
	}

	public static function error( string $errorBoxHtml ): self {
		return new self( null, $errorBoxHtml );
	}

	public function isSuccess(): bool {
		return $this->title !== null;
	}

	public function getTitle(): ?Title {
		return $this->title;
	}

	public function getErrorBox(): ?string {
		return $this->errorBox;
	}

	/**
	 * Returns the Title for a successful result.
	 * Use only after confirming isSuccess() === true.
	 *
	 * @throws \LogicException if called on an error result
	 */
	public function getTitleOrThrow(): Title {
		if ( $this->title === null ) {
			throw new \LogicException( 'getTitleOrThrow() called on an error result' );
		}
		return $this->title;
	}

	/**
	 * Returns the error box HTML for an error result.
	 * Use only after confirming isSuccess() === false.
	 *
	 * @throws \LogicException if called on a success result
	 */
	public function getErrorBoxOrThrow(): string {
		if ( $this->errorBox === null ) {
			throw new \LogicException( 'getErrorBoxOrThrow() called on a success result' );
		}
		return $this->errorBox;
	}
}
