<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Unit\Service;

use MediaWiki\Extension\TabberNeue\Service\TabberRenderer;
use MediaWikiUnitTestCase;

/**
 * @group TabberNeue
 * @coversDefaultClass \MediaWiki\Extension\TabberNeue\Service\TabberRenderer
 */
class TabberRendererTest extends MediaWikiUnitTestCase {

	/**
	 * @covers ::resolveTabWrap
	 * @dataProvider provideWrapArgs
	 */
	public function testResolveTabWrap( array $args, bool $default, bool $expected ): void {
		$this->assertSame( $expected, TabberRenderer::resolveTabWrap( $args, $default ) );
	}

	public static function provideWrapArgs(): array {
		return [
			'no arg, default off' => [ [], false, false ],
			'no arg, default on' => [ [], true, true ],
			'bare wrap' => [ [ 'wrap' => '' ], false, true ],
			'wrap=true' => [ [ 'wrap' => 'true' ], false, true ],
			'wrap=yes' => [ [ 'wrap' => 'yes' ], false, true ],
			'wrap=false overrides default on' => [ [ 'wrap' => 'false' ], true, false ],
			'wrap=no' => [ [ 'wrap' => 'no' ], true, false ],
			'wrap=0' => [ [ 'wrap' => '0' ], true, false ],
			'wrap=off' => [ [ 'wrap' => 'off' ], true, false ],
			'mixed case WRAP=False' => [ [ 'wrap' => 'False' ], true, false ],
		];
	}
}
