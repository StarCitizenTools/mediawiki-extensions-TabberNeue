/**
 * Sliding active-tab indicator. Appends a `<span class="tabber__indicator">` to
 * the tablist at construction. JS writes inline `transform` / `width` on every
 * activation; CSS transitions the change when `tabber-animations-ready` is on.
 * The element's presence is what the `:has()` selector in the stylesheet uses
 * to suppress the per-tab box-shadow indicator.
 *
 * @typedef {Object} TabIndicatorOpts
 * @property {HTMLElement} tablist
 * @property {Document} [document]
 * @property {boolean} [enabled=true] When false, no indicator is created and
 *   update/destroy are no-ops, letting the per-tab box-shadow underline show
 *   (used in wrap mode where a single sliding indicator can't span rows).
 *
 * @typedef {Object} TabIndicator
 * @property {Function} update
 * @property {Function} destroy
 */

/**
 * @param {TabIndicatorOpts} opts
 * @return {TabIndicator}
 */
function createTabIndicator( opts ) {
	const tablist = opts.tablist;
	const doc = opts.document || document;

	if ( opts.enabled === false ) {
		return { update() {}, destroy() {} };
	}

	const element = doc.createElement( 'span' );
	element.className = 'tabber__indicator';
	tablist.appendChild( element );

	/**
	 * @param {HTMLElement|null} activeTab
	 */
	function update( activeTab ) {
		if ( !activeTab ) {
			return;
		}
		element.style.transform = 'translateX(' + activeTab.offsetLeft + 'px)';
		element.style.width = activeTab.offsetWidth + 'px';
	}

	function destroy() {
		element.remove();
	}

	return { update, destroy };
}

module.exports = createTabIndicator;
