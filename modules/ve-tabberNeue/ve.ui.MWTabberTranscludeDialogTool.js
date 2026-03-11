/**
 * VisualEditor UserInterface MWTabberTranscludeDialogTool class.
 *
 * @class
 * @extends ve.ui.FragmentWindowTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.MWTabberTranscludeDialogTool = function VeUiMWTabberTranscludeDialogTool() {
	ve.ui.MWTabberTranscludeDialogTool.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberTranscludeDialogTool, ve.ui.FragmentWindowTool );

/* Static properties */

ve.ui.MWTabberTranscludeDialogTool.static.name = 'mwTabberTransclude';

ve.ui.MWTabberTranscludeDialogTool.static.group = 'object';

ve.ui.MWTabberTranscludeDialogTool.static.icon = 'tabber';

ve.ui.MWTabberTranscludeDialogTool.static.title =
	OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-title' );

ve.ui.MWTabberTranscludeDialogTool.static.modelClasses = [ ve.dm.MWTabberTranscludeNode ];

ve.ui.MWTabberTranscludeDialogTool.static.commandName = 'mwTabberTransclude';

/* Registration */

ve.ui.toolFactory.register( ve.ui.MWTabberTranscludeDialogTool );

/* Commands */

ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'mwTabberTransclude', 'window', 'open',
		{ args: [ 'mwTabberTransclude' ], supportedSelections: [ 'linear' ] }
	)
);
