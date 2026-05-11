<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Integration\Transclusion;

use MediaWiki\Extension\TabberNeue\Transclusion\TransclusionTitleResolver;
use MediaWikiIntegrationTestCase;

/**
 * @group TabberNeue
 * @group Database
 * @group Transclusion
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Transclusion\TransclusionTitleResolver
 */
class TransclusionTitleResolverTest extends MediaWikiIntegrationTestCase {

	/**
	 * @covers ::resolve
	 */
	public function testEmptyStringReturnsError(): void {
		$resolver = new TransclusionTitleResolver();

		$result = $resolver->resolve( '' );

		$this->assertFalse( $result->isSuccess() );
		$this->assertNotNull( $result->getErrorBox() );
		$this->assertStringContainsString( 'Empty', $result->getErrorBox() );
	}

	/**
	 * @covers ::resolve
	 */
	public function testWhitespaceOnlyReturnsError(): void {
		$resolver = new TransclusionTitleResolver();

		$result = $resolver->resolve( '    ' );

		$this->assertFalse( $result->isSuccess() );
	}

	/**
	 * @covers ::resolve
	 */
	public function testNonexistentPageReturnsError(): void {
		$resolver = new TransclusionTitleResolver();

		$result = $resolver->resolve( 'TabberNeueTestNonexistent_' . uniqid() );

		$this->assertFalse( $result->isSuccess() );
		$this->assertStringContainsString( 'does not exist', $result->getErrorBox() );
	}

	/**
	 * @covers ::resolve
	 */
	public function testExistingPageReturnsSuccess(): void {
		$page = $this->getExistingTestPage( 'TabberNeueTestExisting_' . uniqid() );
		$resolver = new TransclusionTitleResolver();

		$result = $resolver->resolve( $page->getTitle()->getPrefixedText() );

		$this->assertTrue( $result->isSuccess() );
		$this->assertSame(
			$page->getTitle()->getPrefixedText(),
			$result->getTitle()->getPrefixedText()
		);
	}
}
