const
	Vue = require( 'vue' ),
	App = require( './App.vue' );

/**
 * @param {Element} tabber
 * @return {void}
 */
function initApp( tabber ) {
	const tabs = tabber.querySelectorAll( ':scope > .tabber__section > .tabber__panel' );

	const tabberData = {
		tabsData: [],
		currentTab: ''
	};

	tabs.forEach( ( tab ) => {
		const label = tab.getAttribute( 'data-title' );

		if ( tab.querySelector( '.tabber' ) ) {
			throw new Error( 'Nested Tabber is not supported in Codex mode, please use legacy mode instead.' );
		}

		tabberData.tabsData.push( {
			name: mw.util.escapeIdForAttribute( label ),
			label: label,
			content: tab.innerHTML
		} );
	} );

	tabberData.currentTab = tabberData.tabsData[ 0 ].name;

	// @ts-ignore MediaWiki-specific function
	Vue.createMwApp(
		App, Object.assign( {
			tabberData: tabberData
		} )
	)
		.mount( tabber );
}

/**
 * @param {Document} document
 * @return {void}
 */
function main( document ) {
	const tabbers = document.querySelectorAll( '.tabber:not( .tabber--live )' );
	const sortedTabbers = [];

	/* Nested Tabber children needed to be rendered before parents */
	tabbers.forEach( ( tabber ) => {
		if ( tabber.querySelector( '.tabber:not( .tabber--live )' ) ) {
			sortedTabbers.push( tabber );
		} else {
			sortedTabbers.unshift( tabber );
		}
	} );

	sortedTabbers.forEach( initApp );
}

main( document );