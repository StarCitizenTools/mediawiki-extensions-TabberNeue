/**
 * VisualEditor UserInterface MWTabberTranscludeInspectorTool class.
 *
 * @class
 * @extends ve.ui.FragmentInspectorTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.MWTabberTranscludeInspectorTool = function VeUiMWTabberTranscludeInspectorTool() {
	ve.ui.MWTabberTranscludeInspectorTool.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberTranscludeInspectorTool, ve.ui.FragmentInspectorTool );

/* Static properties */

ve.ui.MWTabberTranscludeInspectorTool.static.name = 'mwTabberTransclude';

ve.ui.MWTabberTranscludeInspectorTool.static.group = 'object';

ve.ui.MWTabberTranscludeInspectorTool.static.icon = 'tabber';

ve.ui.MWTabberTranscludeInspectorTool.static.title =
	OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-title' );

ve.ui.MWTabberTranscludeInspectorTool.static.modelClasses = [ ve.dm.MWTabberTranscludeNode ];

ve.ui.MWTabberTranscludeInspectorTool.static.commandName = 'mwTabberTransclude';

/* Registration */

ve.ui.toolFactory.register( ve.ui.MWTabberTranscludeInspectorTool );

/* Commands */

ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'mwTabberTransclude', 'window', 'open',
		{ args: [ 'mwTabberTransclude' ], supportedSelections: [ 'linear' ] }
	)
);
