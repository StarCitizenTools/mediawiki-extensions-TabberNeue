const config = require( './config.json' );
const createRegistry = require( './tabberRegistry.js' );

const registry = createRegistry( { config, mw, document, window } );

mw.hook( 'wikipage.content' ).add( () => {
	registry.scan();
} );

mw.loader.using( 'ext.visualEditor.desktopArticleTarget.init' ).then( () => {
	mw.hook( 'postEdit.afterRemoval' ).add( () => {
		registry.scan();
	} );
} );
