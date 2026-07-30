<?php
declare( strict_types=1 );

namespace MediaWiki\Extension\TabberNeue\Tests\Integration;

use MediaWiki\Html\TemplateParser;
use MediaWikiIntegrationTestCase;

/**
 * Renders the Tabs template directly and asserts that label-derived ID
 * attribute values are HTML-escaped. Testing at the template-render level pins
 * the escaping at the sink itself, upstream of any parser tidy that could
 * otherwise mask a regression. See advisory GHSA-9cj7-4vh9-4x83.
 *
 * @group TabberNeue
 * @coversNothing
 */
class TabsTemplateEscapingTest extends MediaWikiIntegrationTestCase {

	private function render( string $attrValue ): string {
		$templateParser = new TemplateParser( __DIR__ . '/../../../includes/templates' );
		return $templateParser->processTemplate( 'Tabs', [
			'array-attributes' => [ [ 'key' => 'class', 'value' => 'tabber tabber--init' ] ],
			'array-tabs' => [ [
				'label' => 'Label',
				'content' => 'Content',
				'array-tab-attributes' => [ [ 'key' => 'id', 'value' => $attrValue ] ],
				'array-tabpanel-attributes' => [ [ 'key' => 'id', 'value' => $attrValue ] ],
			] ],
		] );
	}

	public function testAttributeValuesAreEscaped(): void {
		// A value carrying characters that are significant inside an HTML
		// attribute (quote and separator), applied to both the tab and panel
		// ID attributes.
		$html = $this->render( 'x"/data-injected="y' );

		// The double quote must be HTML-escaped, keeping the value inert.
		$this->assertStringContainsString( 'x&quot;/data-injected=&quot;y', $html );
		// A regression to the unescaped {{{value}}} would let the value close the
		// attribute and start a new one; assert neither sink does.
		$this->assertStringNotContainsString( '"/data-injected=', $html );
		$this->assertDoesNotMatchRegularExpression( '/[\s\/]data-injected=(["\'])/', $html );
	}

	public function testOrdinaryValuesRenderUnchanged(): void {
		$html = $this->render( 'tabber-Section_1' );
		$this->assertStringContainsString( 'id="tabber-Section_1"', $html );
	}
}
