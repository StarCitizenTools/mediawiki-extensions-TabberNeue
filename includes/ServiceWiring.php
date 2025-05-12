<?php
declare( strict_types=1 );

use MediaWiki\Extension\TabberNeue\Service\TabNameHelper;
use MediaWiki\MediaWikiServices;

return [
	'TabberNeue.TabNameHelper' => static function ( MediaWikiServices $services ): TabNameHelper {
		return new TabNameHelper(
			$services->getMainConfig()->get( 'TabberNeueParseTabName' )
		);
	}
];
