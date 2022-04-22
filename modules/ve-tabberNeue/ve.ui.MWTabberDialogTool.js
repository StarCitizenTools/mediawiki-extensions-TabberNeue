/**
 * VisualEditor UserInterface MWTabberDialogTool class.
 *
 * @class
 * @extends ve.ui.FragmentWindowTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.MWTabberDialogTool = function VeUiMWTabberDialogTool() {
	ve.ui.MWTabberDialogTool.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberDialogTool, ve.ui.FragmentWindowTool );

/* Static properties */

ve.ui.MWTabberDialogTool.static.name = 'mwTabber';

ve.ui.MWTabberDialogTool.static.group = 'object';

ve.ui.MWTabberDialogTool.static.icon = 'tabber';

ve.ui.MWTabberDialogTool.static.title =
	OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberdialog-title' );

ve.ui.MWTabberDialogTool.static.modelClasses = [ ve.dm.MWTabberNode ];

ve.ui.MWTabberDialogTool.static.commandName = 'mwTabber';

/* Registration */

ve.ui.toolFactory.register( ve.ui.MWTabberDialogTool );

/* Commands */

ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'mwTabber', 'window', 'open',
		{ args: [ 'mwTabber' ], supportedSelections: [ 'linear' ] }
	)
);

/*
ve.ui.sequenceRegistry.register(
	new ve.ui.Sequence( 'wikitextTabber', 'tabber', '<tabber', 6 )
);
*/

/* Only enable when the tool is more helpful
ve.ui.commandHelpRegistry.register( 'insert', 'mwTabber', {
	sequences: [ 'wikitextTabber' ],
	label: OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberdialog-title' )
} );
*/
