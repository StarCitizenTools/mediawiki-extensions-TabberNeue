/**
 * VisualEditor UserInterface MWTabberDialog class.
 *
 * @class
 * @extends ve.ui.MWExtensionPreviewDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MWTabberDialog = function VeUiMWTabberDialog() {
	// Parent constructor
	ve.ui.MWTabberDialog.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberDialog, ve.ui.MWExtensionPreviewDialog );

/* Static properties */

ve.ui.MWTabberDialog.static.name = 'mwTabber';

ve.ui.MWTabberDialog.static.title =
	OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberdialog-title' );

ve.ui.MWTabberDialog.static.modelClasses = [ ve.dm.MWTabberNode ];

ve.ui.MWTabberDialog.static.dir = 'ltr';

ve.ui.MWTabberDialog.static.size = 'larger';

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.initialize = function () {
	// Parent method
	ve.ui.MWTabberDialog.super.prototype.initialize.call( this );

	this.input = new ve.ui.MWAceEditorWidget( {
		rows: 10,
		maxRows: 25,
		autosize: true
	} )
		.setLanguage( 'mediawiki' )
		.toggleLineNumbers( false );

	this.input.connect( this, { resize: 'updateSize' } );

	const inputField = new OO.ui.FieldLayout( this.input, {
		align: 'top'
	} );

	const panel = new OO.ui.PanelLayout( {
		expanded: false,
		padded: true
	} );

	panel.$element.append( inputField.$element );

	this.$body
		.addClass( 've-ui-mwTabberDialog-content' )
		.append( panel.$element );
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.MWTabberDialog );
