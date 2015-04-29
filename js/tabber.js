/**
 * Tabber JS
 *
 * @author		Alexia E. Smith, Kris Blair
 * @license		GPL
 * @package		Tabber
 * @link		https://www.mediawiki.org/wiki/Extension:Tabber
 */
 
 (function($) {
	$.fn.tabber = function() {
		// create tabs
		var tabContent = this.find('.tabbertab'),
		    nav = $('<ul>').addClass('tabbernav');
		tabContent.each(function() {
			var title = $(this).attr('title'),
			    anchor = $('<a>').text(title).attr('title', title).attr('href', 'javascript:void(0);');
			$('<li>').append(anchor).appendTo(nav);
		});
		this.prepend(nav);

		// setup initial state
		var displayedContent, loc = location.hash.replace('#', '');;
		tabContent.hide();
		if (loc != '') {
			displayedContent = tabContent.filter('[title="'+loc+'"]')
		} else {
			displayedContent = tabContent.first();
		}
		displayedContent.show();
		nav.find('a[title="'+displayedContent.attr('title')+'"]').parent().addClass('tabberactive');

		this.addClass('tabberlive');
		return this;
	};

	// Repond to clicks on the nav tabs
	$(document).on('click', '.tabbernav li a', function(e) {
		var title = $(this).attr('title');
		e.preventDefault();
		location.hash = '#' + title;
		$('.tabbertab').hide();
		$('.tabberactive').removeClass('tabberactive');
		$('.tabbertab[title="' + title + '"]').show();
		$('.tabbernav li a[title="' + title + '"]').parent().addClass('tabberactive');
	});
})(jQuery);

$(document).ready(function() {
	$('.tabber').tabber();
});
