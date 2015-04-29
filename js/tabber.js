/**
 * Tabber JS
 *
 * @author		Alexia E. Smith, Kris Blair
 * @license		GPL
 * @package		Tabber
 * @link		https://www.mediawiki.org/wiki/Extension:Tabber
 */
 
 (function($) {
	var tabs = {};

	$.fn.tabber = function() {
		var nav = $('<ul>');
		this.each(function() {
			var navli = $('<li>'),
				nava = $('<a>'),
				title = $(this).attr('title');
			nava.text(title)
				.attr('href', 'javascript:void(null);')
				.title = title;
			navli.append(nava);
			nav.append(navli);
		});
		nav.addClass('tabbernav');
		$('.tabber').append(nav);
		$('.tabbertab').first().show();
		if (document.hash != '' && document.hash != '#') {
			var display = document.hash.replace('#', '');
			$('.tabbertab[title="' + display + '"]').show();
			$('.tabbernav li a[title="' + display + '"]').addClass('tabberactive');
		} else {
			var display = $('.tabbertab');
			display.first().show();
			$('.tabbernav li [title="' + display.attr('title') + '"]').first().addClass('tabberactive');
		}
		return this;
	};

	$('.tabbernav li a').click(function() {
		tabShow($(this).attr('title'));
	})

	function tabShow(tabberIndex) {
		location.hash = '#' + title;
		$('.tabbertab').hide();
		$('.tabberactive').removeClass('tabberactive');
		$('.tabbertab[title="' + title + '"]').show();
		$('.tabbernav li a[title="' + title + '"]').addClass('tabberactive');
	}
})(jQuery);

$(document).ready(function() {
	$('.tabber').tabber();
});
