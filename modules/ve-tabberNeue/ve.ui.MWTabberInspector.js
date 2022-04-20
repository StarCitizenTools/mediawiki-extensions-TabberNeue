/**
 * MediaWiki Tabber inspector.
 *
 * @class
 * @extends ve.ui.MWLiveExtensionInspector
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MWTabberInspector = function VeUiMWTabberInspector() {
	// Parent constructor
	ve.ui.MWTabberInspector.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberInspector, ve.ui.MWLiveExtensionInspector );

/* Static properties */

ve.ui.MWTabberInspector.static.name = 'tabber';

ve.ui.MWTabberInspector.static.title =
	OO.ui.deferMsg( 'wikitabber-visualeditor-mwtabberinspector-title' );

ve.ui.MWTabberInspector.static.modelClasses = [ ve.dm.MWTabberNode ];

ve.ui.MWTabberInspector.static.dir = 'ltr';

/* Registration */

ve.ui.windowFactory.register( ve.ui.MWTabberInspector );
