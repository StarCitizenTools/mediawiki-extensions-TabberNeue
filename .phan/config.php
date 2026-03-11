<?php

$cfg = require __DIR__ . '/../vendor/mediawiki/mediawiki-phan-config/src/config.php';

// Scribunto is an optional dependency — include it for type resolution when available.
$scribuntoDir = __DIR__ . '/../../../extensions/Scribunto';
if ( is_dir( $scribuntoDir ) ) {
	$cfg['directory_list'][] = $scribuntoDir;
	$cfg['exclude_analysis_directory_list'][] = $scribuntoDir;
}

return $cfg;
