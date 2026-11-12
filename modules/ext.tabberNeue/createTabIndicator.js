/**
 * Sliding active-tab indicator. attach() appends a `<span class="tabber__indicator">`
 * to the tablist. JS writes inline `transform` / `width` on every activation;
 * CSS transitions the change when `tabber-animations-ready` is on. The
 * element's presence is what the `:has()` selector in the stylesheet uses to
 * suppress the per-tab box-shadow indicator.
 *
 * @typedef {Object} TabIndicatorOpts
 * @property {HTMLElement} tablist
 * @property {Document} [document]
 * @property {boolean} [enabled=true] When false, no indicator is created and
 *   every method is a no-op, letting the per-tab box-shadow underline show
 *   (used in wrap mode where a single sliding indicator can't span rows).
 *
 * @typedef {Object} TabIndicator
 * @property {Function} attach
 * @property {Function} measure
 * @property {Function} apply
 * @property {Function} update
 * @property {Function} destroy
 *
 * @typedef {Object} TabIndicatorMetrics
 * @property {number} left
 * @property {number} width
 */

/**
 * @param {TabIndicatorOpts} opts
 * @return {TabIndicator}
 */
function createTabIndicator( opts ) {
	const tablist = opts.tablist;
	const doc = opts.document || document;

	if ( opts.enabled === false ) {
		return { attach() {}, measure: () => null, apply() {}, update() {}, destroy() {} };
	}

	const element = doc.createElement( 'span' );
	element.className = 'tabber__indicator';
	// Decorative sliding underline. aria-hidden keeps it out of the a11y tree
	// so role="tablist" exposes only its tab children; it must stay a tablist
	// child for the stylesheet's :has( > .tabber__indicator ) selector.
	element.setAttribute( 'aria-hidden', 'true' );

	function attach() {
		tablist.appendChild( element );
	}

	/**
	 * @param {HTMLElement|null} activeTab
	 * @return {TabIndicatorMetrics|null}
	 */
	function measure( activeTab ) {
		if ( !activeTab ) {
			return null;
		}
		return { left: activeTab.offsetLeft, width: activeTab.offsetWidth };
	}

	/**
	 * @param {TabIndicatorMetrics|null} metrics
	 */
	function apply( metrics ) {
		if ( !metrics ) {
			return;
		}
		element.style.transform = 'translateX(' + metrics.left + 'px)';
		element.style.width = metrics.width + 'px';
	}

	/**
	 * @param {HTMLElement|null} activeTab
	 */
	function update( activeTab ) {
		apply( measure( activeTab ) );
	}

	function destroy() {
		element.remove();
	}

	return { attach, measure, apply, update, destroy };
}

module.exports = createTabIndicator;
