/**
 * VisualEditor user interface MWTabberDialog class.
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

ve.ui.MWTabberDialog.static.name = 'tabber';

ve.ui.MWTabberDialog.static.title =
	OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberinspector-title' );

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
        rows: 20,
    } ).setLanguage( 'mediawiki' );

    var inputField = new OO.ui.FieldLayout( this.input, {
        align: 'top',
        label: ve.msg( 'raw-input' )
    } );

    this.$body
            .addClass( 've-ui-mwTabberDialog-content' )
            .append( inputField.$element );
};


/* Registration */

ve.ui.windowFactory.register( ve.ui.MWTabberDialog );
