<?php
/**
 * Tabber
 *
 * @author		Eric Fortin, Alexia E. Smith, Kris Blair
 * @license		GPL
 * @package		Tabber
 * @link		https://www.mediawiki.org/wiki/Extension:Tabber
 */

/*****************************************/
/*                Credits                */
/*****************************************/
$credits = [
	'path'				=> __FILE__,
	'name'				=> 'Tabber',
	'author'			=> ['Eric Fortin', 'Alexia E. Smith', 'Curse Inc. Wiki Platform Team', 'Kris Blair'],
	'url'				=> 'https://www.mediawiki.org/wiki/Extension:Tabber',
	'descriptionmsg'	=> 'tabber-desc',
	'version'			=> '2.1'
];
$wgExtensionCredits['parserhook'][] = $credits;

/*****************************************/
/* Language Strings, Page Aliases, Hooks */
/*****************************************/
$extDir = __DIR__ . '/';

$wgMessagesDirs['Tabber']			= "{$extDir}/i18n";
$wgExtensionMessagesFiles['Tabber']	= "{$extDir}/Tabber.i18n.php";

$wgAutoloadClasses['TabberHooks']	= "{$extDir}/Tabber.hooks.php";

$wgHooks['ParserFirstCallInit'][]	= 'TabberHooks::onParserFirstCallInit';

$wgResourceModules['ext.Tabber']	= [
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'Tabber',
	'styles'		=> ['css/tabber.css'],
	'scripts'		=> ['js/tabber.js']
];
