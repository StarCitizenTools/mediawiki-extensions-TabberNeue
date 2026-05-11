<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Unit\Parsing;

use MediaWiki\Extension\TabberNeue\DataModel\TabSegment;
use MediaWiki\Extension\TabberNeue\DataModel\TransclusionLine;
use MediaWiki\Extension\TabberNeue\Parsing\TabSegmentSplitter;
use MediaWikiUnitTestCase;

/**
 * @group TabberNeue
 * @group Parsing
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Parsing\TabSegmentSplitter
 */
class TabSegmentSplitterTest extends MediaWikiUnitTestCase {

	private TabSegmentSplitter $splitter;

	protected function setUp(): void {
		parent::setUp();
		$this->splitter = new TabSegmentSplitter();
	}

	/**
	 * @covers ::splitTabber
	 */
	public function testSplitTabberEmptyReturnsEmpty(): void {
		$this->assertSame( [], $this->splitter->splitTabber( '' ) );
	}

	/**
	 * @covers ::splitTabber
	 */
	public function testSplitTabberSingleSegment(): void {
		$result = $this->splitter->splitTabber( '|-|Label=Content' );
		$this->assertCount( 1, $result );
		$this->assertInstanceOf( TabSegment::class, $result[0] );
		$this->assertSame( 'Label', $result[0]->rawLabel );
		$this->assertSame( 'Content', $result[0]->rawContent );
	}

	/**
	 * @covers ::splitTabber
	 */
	public function testSplitTabberMultipleSegments(): void {
		$result = $this->splitter->splitTabber( '|-|A=1|-|B=2|-|C=3' );
		$this->assertCount( 3, $result );
		$this->assertSame( [ 'A', 'B', 'C' ], array_map( static fn ( $s ) => $s->rawLabel, $result ) );
		$this->assertSame( [ '1', '2', '3' ], array_map( static fn ( $s ) => $s->rawContent, $result ) );
	}

	/**
	 * @covers ::splitTabber
	 */
	public function testSplitTabberSegmentWithoutEqualsIsSkipped(): void {
		$result = $this->splitter->splitTabber( '|-|Label=Content|-|MalformedNoEquals|-|B=2' );
		$this->assertCount( 2, $result );
		$this->assertSame( 'Label', $result[0]->rawLabel );
		$this->assertSame( 'B', $result[1]->rawLabel );
	}

	/**
	 * @covers ::splitTabber
	 */
	public function testSplitTabberContentMayContainEquals(): void {
		$result = $this->splitter->splitTabber( '|-|Equation=x = y + 1' );
		$this->assertCount( 1, $result );
		$this->assertSame( 'Equation', $result[0]->rawLabel );
		$this->assertSame( 'x = y + 1', $result[0]->rawContent );
	}

	/**
	 * @covers ::splitTabber
	 */
	public function testSplitTabberWhitespaceOnlySegmentSkipped(): void {
		$result = $this->splitter->splitTabber( '|-|   |-|Label=Content' );
		$this->assertCount( 1, $result );
		$this->assertSame( 'Label', $result[0]->rawLabel );
	}

	/**
	 * @covers ::splitTransclude
	 */
	public function testSplitTranscludeEmptyReturnsEmpty(): void {
		$this->assertSame( [], $this->splitter->splitTransclude( '' ) );
	}

	/**
	 * @covers ::splitTransclude
	 */
	public function testSplitTranscludeSingleLine(): void {
		$result = $this->splitter->splitTransclude( 'PageName|TabLabel' );
		$this->assertCount( 1, $result );
		$this->assertInstanceOf( TransclusionLine::class, $result[0] );
		$this->assertSame( 'PageName', $result[0]->pageName );
		$this->assertSame( 'TabLabel', $result[0]->rawLabel );
	}

	/**
	 * @covers ::splitTransclude
	 */
	public function testSplitTranscludeMultipleLines(): void {
		$result = $this->splitter->splitTransclude( "P1|L1\nP2|L2\nP3|L3" );
		$this->assertCount( 3, $result );
		$this->assertSame( [ 'P1', 'P2', 'P3' ], array_map( static fn ( $l ) => $l->pageName, $result ) );
		$this->assertSame( [ 'L1', 'L2', 'L3' ], array_map( static fn ( $l ) => $l->rawLabel, $result ) );
	}

	/**
	 * @covers ::splitTransclude
	 */
	public function testSplitTranscludeMissingLabelIsEmpty(): void {
		$result = $this->splitter->splitTransclude( 'PageOnly' );
		$this->assertCount( 1, $result );
		$this->assertSame( 'PageOnly', $result[0]->pageName );
		$this->assertSame( '', $result[0]->rawLabel );
	}

	/**
	 * @covers ::splitTransclude
	 */
	public function testSplitTranscludeBlankLinesSkipped(): void {
		$result = $this->splitter->splitTransclude( "\nP1|L1\n\nP2|L2\n\n" );
		$this->assertCount( 2, $result );
	}

	/**
	 * @covers ::splitTransclude
	 */
	public function testSplitTranscludeLabelMayContainPipe(): void {
		$result = $this->splitter->splitTransclude( 'Page|Label|with|pipes' );
		$this->assertCount( 1, $result );
		$this->assertSame( 'Page', $result[0]->pageName );
		$this->assertSame( 'Label|with|pipes', $result[0]->rawLabel );
	}
}
