<?php
if ( !defined( 'MEDIAWIKI' ) ) {
	die( 'This file is part of a MediaWiki extension and is not a valid entry point.' );
}

# Credits
$wgExtensionCredits['parserhook'][] = array(
	'name' => 'Tabber',
	'author' => 'Eric Fortin',
	'url' => 'https://www.mediawiki.org/wiki/Extension:Tabber',
	'descriptionmsg' => 'tabber-desc',
	'version' => '1.2'
);
$dir = dirname(__FILE__) . '/';

# Internationalisation file
$wgExtensionMessagesFiles['Tabber'] = $dir . 'Tabber.i18n.php';

$wgExtensionFunctions[] = "wfTabber";

// function adds the wiki extension
function wfTabber() {
	global $wgParser;
	$wgParser->setHook( "tabber", "renderTabber" );
}

function renderTabber( $paramstring, $params = array() ){
	global $wgParser, $wgScriptPath;
	$wgParser->disableCache();
	
	$path = $wgScriptPath . '/extensions/Tabber/';

	$htmlHeader = '<script type="text/javascript" src="'.$path.'Tabber.js"></script>'
		. '<link rel="stylesheet" href="'.$path.'Tabber.css" TYPE="text/css" MEDIA="screen">'
		. '<div class="tabber">';
		
	$htmlFooter = '</div>';
	
	$htmlTabs = '';
	
	$arr = explode("|-|", $paramstring);
	foreach($arr as $tab){
		$htmlTabs .= buildTab($tab);
	}

	return $htmlHeader . $htmlTabs . $htmlFooter;
}

function buildTab($tab){
	global $wgParser;
	
	if( trim($tab) == '' ) return '';
	
	$arr = preg_split("/=/",$tab);
	$tabName = array_shift( $arr );
	$tabBody = $wgParser->recursiveTagParse( implode("=",$arr) );
	
	$tab = '<div class="tabbertab" title="'.htmlspecialchars($tabName).'">'
		. '<p>'.$tabBody.'</p>'
		. '</div>';

	return $tab;
}
