/**
 * MediaWiki UserInterface Tabber tool.
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

ve.ui.MWTabberDialogTool.static.name = 'tabber';

ve.ui.MWTabberDialogTool.static.group = 'object';

ve.ui.MWTabberDialogTool.static.icon = 'listBullet';

ve.ui.MWTabberDialogTool.static.title =
	OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberinspector-title' );

ve.ui.MWTabberDialogTool.static.modelClasses = [ ve.dm.MWTabberNode ];

ve.ui.MWTabberDialogTool.static.commandName = 'tabber';

/* Registration */

ve.ui.toolFactory.register( ve.ui.MWTabberDialogTool );

/* Commands */

ve.ui.commandRegistry.register(
	new ve.ui.Command(
		'tabber', 'window', 'open',
		{ args: [ 'tabber' ], supportedSelections: [ 'linear' ] }
	)
);

ve.ui.sequenceRegistry.register(
	new ve.ui.Sequence( 'wikitextTabber', 'tabber', '<tabber', 6 )
);

ve.ui.commandHelpRegistry.register( 'insert', 'tabber', {
	sequences: [ 'wikitextTabber' ],
	label: OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberinspector-title' )
} );
