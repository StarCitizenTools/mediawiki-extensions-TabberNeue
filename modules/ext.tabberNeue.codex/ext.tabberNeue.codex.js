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

		tabberData.tabsData.push( {
			name: mw.util.escapeIdForAttribute( label ),
			label: label,
			content: tab.innerHTML
		} );
	} );

	tabberData.currentTab = tabberData.tabsData[ 0 ].name;

	//@ts-ignore MediaWiki-specific function
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

	tabbers.forEach( initApp );
}

main( document );

/*
 * Add hooks for Tabber when Visual Editor is used.
*/
mw.loader.using( 'ext.visualEditor.desktopArticleTarget.init', function () {
	// After saving edits
	mw.hook( 'postEdit.afterRemoval' ).add( () => {
		main( document );
	} );
} );
