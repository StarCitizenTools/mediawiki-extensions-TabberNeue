<?php
/**
 * Tabber
 * Tabber Hooks Class
 *
 * @package Tabber
 * @author  Eric Fortin, Alexia E. Smith
 * @license GPL-3.0-only
 * @link    https://www.mediawiki.org/wiki/Extension:Tabber
**/

namespace Tabber;

use Parser;
use PPFrame;

class TabberHooks {
	/**
	 * Sets up this extension's parser functions.
	 *
	 * @param object $parser Parser object passed as a reference.
	 *
	 * @return boolean	true
	 */
	public static function onParserFirstCallInit(Parser &$parser) {
		$parser->setHook("tabber", "Tabber\\TabberHooks::renderTabber");

		return true;
	}

	/**
	 * Renders the necessary HTML for a <tabber> tag.
	 *
	 * @param string $input  The input URL between the beginning and ending tags.
	 * @param array  $args   Array of attribute arguments on that beginning tag.
	 * @param object $parser Mediawiki Parser Object
	 * @param object $frame  Mediawiki PPFrame Object
	 *
	 * @return string	HTML
	 */
	public static function renderTabber($input, array $args, Parser $parser, PPFrame $frame) {
		$parser->getOutput()->addModules('ext.Tabber');

		$key = md5($input);
		$arr = explode("|-|", $input);
		$htmlTabs = '';
		foreach ($arr as $tab) {
			$htmlTabs .= self::buildTab($tab, $parser, $frame);
		}

		$HTML = '<div id="tabber-' . $key . '" class="tabber">' . $htmlTabs . "</div>";

		return $HTML;
	}

	/**
	 * Build individual tab.
	 *
	 * @param string $tab    Tab information
	 * @param object $parser Mediawiki Parser Object
	 * @param object $frame  Mediawiki PPFrame Object
	 *
	 * @return string	HTML
	 */
	private static function buildTab($tab, Parser $parser, PPFrame $frame) {
		$tab = trim($tab);
		if (empty($tab)) {
			return $tab;
		}

		// Use array_pad to make sure at least 2 array values are always returned
		list($tabName, $tabBody) = array_pad(explode('=', $tab, 2), 2, '');

		$tabBody = $parser->recursiveTagParse($tabBody, $frame);

		$tab = '
			<div class="tabbertab" title="' . htmlspecialchars($tabName) . '">
				<p>' . $tabBody . '</p>
			</div>';

		return $tab;
	}
}
