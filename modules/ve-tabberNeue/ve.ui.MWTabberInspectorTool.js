/**
 * MediaWiki UserInterface Tabber tool.
 *
 * @class
 * @extends ve.ui.FragmentInspectorTool
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */
ve.ui.MWTabberInspectorTool = function VeUiMWTabberInspectorTool() {
	ve.ui.MWTabberInspectorTool.super.apply( this, arguments );
};
OO.inheritClass( ve.ui.MWTabberInspectorTool, ve.ui.FragmentInspectorTool );
ve.ui.MWTabberInspectorTool.static.name = 'tabber';
ve.ui.MWTabberInspectorTool.static.group = 'object';
ve.ui.MWTabberInspectorTool.static.icon = 'listBullet';
ve.ui.MWTabberInspectorTool.static.title =
	OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberinspector-title' );
ve.ui.MWTabberInspectorTool.static.modelClasses = [ ve.dm.MWTabberNode ];
ve.ui.MWTabberInspectorTool.static.commandName = 'tabber';

ve.ui.toolFactory.register( ve.ui.MWTabberInspectorTool );
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
	label: OO.ui.deferMsg( 'wikitabber-visualeditor-mwtabberinspector-title' )
} );
