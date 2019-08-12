(function($) {
  $.fn.tabber = function() {
    return this.each(function() {

      // Create tabs
      var $this = $(this),
        tabContent = $this.children('.tabbertab'),
        loc;
      var tabcount = 0;
      var index = new OO.ui.IndexLayout();

      tabContent.each(function() {
        tabcount++;
        CreateTab(this.title, tabcount);
      });

      $('.tabber').append(index.$element);

      function CreateTab(title, count) {

        var content = $('.tabbertab[title="' + title + '"]');
        //var content = tabContent.filter('[data-hash="' + title + '"]');

        function TabPanelLayout(name, config) {
          TabPanelLayout.super.call(this, name, config);
          this.$element.attr('title', title).attr('data-hash', mw.util.escapeIdForAttribute(title));
          this.$element.append(content);
        }

        OO.inheritClass(TabPanelLayout, OO.ui.TabPanelLayout);
        TabPanelLayout.prototype.setupTabItem = function() {
          this.tabItem.setLabel(title);
        };

        var tabPanel = new TabPanelLayout(tabcount);

        index.addTabPanels([tabPanel]);
      }
    });
  };
}(jQuery));

$(document).ready(function() {
  $('.tabber').tabber();
});
