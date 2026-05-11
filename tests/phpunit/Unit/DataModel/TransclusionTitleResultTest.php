<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Unit\DataModel;

use MediaWiki\Extension\TabberNeue\DataModel\TransclusionTitleResult;
use MediaWiki\Title\Title;
use MediaWikiUnitTestCase;

/**
 * @group TabberNeue
 * @group DataModel
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\DataModel\TransclusionTitleResult
 */
class TransclusionTitleResultTest extends MediaWikiUnitTestCase {

	/**
	 * @covers ::success
	 * @covers ::isSuccess
	 * @covers ::getTitle
	 * @covers ::getErrorBox
	 */
	public function testSuccessHoldsTitle(): void {
		$title = $this->createMock( Title::class );

		$result = TransclusionTitleResult::success( $title );

		$this->assertTrue( $result->isSuccess() );
		$this->assertSame( $title, $result->getTitle() );
		$this->assertNull( $result->getErrorBox() );
	}

	/**
	 * @covers ::error
	 * @covers ::isSuccess
	 * @covers ::getTitle
	 * @covers ::getErrorBox
	 */
	public function testErrorHoldsErrorBox(): void {
		$result = TransclusionTitleResult::error( '<div class="errorbox">oops</div>' );

		$this->assertFalse( $result->isSuccess() );
		$this->assertNull( $result->getTitle() );
		$this->assertSame( '<div class="errorbox">oops</div>', $result->getErrorBox() );
	}

	/**
	 * @covers ::getTitleOrThrow
	 */
	public function testGetTitleOrThrowReturnsTitle(): void {
		$title = $this->createMock( Title::class );
		$result = TransclusionTitleResult::success( $title );

		$this->assertSame( $title, $result->getTitleOrThrow() );
	}

	/**
	 * @covers ::getTitleOrThrow
	 */
	public function testGetTitleOrThrowThrowsOnError(): void {
		$result = TransclusionTitleResult::error( '<div class="errorbox">oops</div>' );

		$this->expectException( \LogicException::class );
		$result->getTitleOrThrow();
	}

	/**
	 * @covers ::getErrorBoxOrThrow
	 */
	public function testGetErrorBoxOrThrowReturnsErrorBox(): void {
		$result = TransclusionTitleResult::error( '<div class="errorbox">oops</div>' );

		$this->assertSame( '<div class="errorbox">oops</div>', $result->getErrorBoxOrThrow() );
	}

	/**
	 * @covers ::getErrorBoxOrThrow
	 */
	public function testGetErrorBoxOrThrowThrowsOnSuccess(): void {
		$title = $this->createMock( Title::class );
		$result = TransclusionTitleResult::success( $title );

		$this->expectException( \LogicException::class );
		$result->getErrorBoxOrThrow();
	}
}
