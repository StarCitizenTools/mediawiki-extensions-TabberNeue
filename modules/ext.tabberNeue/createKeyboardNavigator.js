/**
 * Roving-tabindex keyboard navigator for a `.tabber__tabs` element.
 *
 * @typedef {Object} KeyboardNavigatorOpts
 * @property {HTMLElement} tablist
 * @property {ArrayLike<HTMLElement>} tabs
 * @property {Function} onActivate called when the user moves focus via Home/End/Arrow keys.
 *
 * @typedef {Object} KeyboardNavigator
 * @property {Function} destroy
 */

// Known limitation (inherited from the original Tabber.handleTabFocusChange):
// the internal tabFocus index is not synchronized with native focus events.
// If the user Tab-focuses a tab other than the current tabFocus and then
// presses an arrow key, navigation starts from tabFocus rather than the
// natively-focused tab. Fixing this requires per-tab focus listeners and a
// matching destroy() teardown — out of scope for this refactor; track as a
// follow-up.

/**
 * @param {KeyboardNavigatorOpts} opts
 * @return {KeyboardNavigator}
 */
function createKeyboardNavigator( opts ) {
	const tablist = opts.tablist;
	const tabs = Array.from( opts.tabs );
	if ( tabs.length === 0 ) {
		return {
			destroy() {}
		};
	}
	const onActivate = opts.onActivate;
	let tabFocus = 0;

	function moveFocus( direction ) {
		tabs[ tabFocus ].setAttribute( 'tabindex', '-1' );
		const tabCount = tabs.length;
		switch ( direction ) {
			case 'home':
				tabFocus = 0;
				break;
			case 'end':
				tabFocus = tabCount - 1;
				break;
			case 'right':
				tabFocus = ( tabFocus + 1 ) % tabCount;
				break;
			case 'left':
				tabFocus = ( tabFocus - 1 + tabCount ) % tabCount;
				break;
			default:
				return;
		}
		tabs[ tabFocus ].setAttribute( 'tabindex', '0' );
		tabs[ tabFocus ].focus();
		onActivate( tabs[ tabFocus ] );
	}

	function onKeydown( e ) {
		const keyMap = {
			Home: 'home',
			End: 'end',
			ArrowRight: 'right',
			ArrowLeft: 'left'
		};
		if ( keyMap[ e.key ] ) {
			e.preventDefault();
			moveFocus( keyMap[ e.key ] );
		}
	}

	tablist.addEventListener( 'keydown', onKeydown );

	return {
		destroy() {
			tablist.removeEventListener( 'keydown', onKeydown );
		}
	};
}

module.exports = createKeyboardNavigator;
