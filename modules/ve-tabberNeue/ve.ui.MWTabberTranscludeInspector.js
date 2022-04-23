/**
 * VisualEditor UserInterface MWTabberTranscludeInspector class.
 *
 * @class
 * @extends ve.ui.MWLiveExtensionInspector
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MWTabberTranscludeInspector = function VeUiMWTabberTranscludeInspector() {
	// Parent constructor
	ve.ui.MWTabberTranscludeInspector.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberTranscludeInspector, ve.ui.MWLiveExtensionInspector );

/* Static properties */

ve.ui.MWTabberTranscludeInspector.static.name = 'mwTabberTransclude';

ve.ui.MWTabberTranscludeInspector.static.title =
	OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-title' );

ve.ui.MWTabberTranscludeInspector.static.modelClasses = [ ve.dm.MWTabberTranscludeNode ];

ve.ui.MWTabberTranscludeInspector.static.dir = 'ltr';

/* Registration */

ve.ui.windowFactory.register( ve.ui.MWTabberTranscludeInspector );
