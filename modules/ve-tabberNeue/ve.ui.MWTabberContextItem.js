/**
 * VisualEditor MWTabberContextItem class.
 *
 * @class
 * @extends ve.ui.LinearContextItem
 *
 * @constructor
 * @param {ve.ui.Context} context Context item is in
 * @param {ve.dm.Model} model Model item is related to
 * @param {Object} config Configuration options
 */
ve.ui.MWTabberContextItem = function VeUiMWTabberContextItem() {
	// Parent constructor
	ve.ui.MWTabberContextItem.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberContextItem, ve.ui.LinearContextItem );

/* Static Properties */

ve.ui.MWTabberContextItem.static.name = 'mwTabber';

ve.ui.MWTabberContextItem.static.icon = 'tabber';

ve.ui.MWTabberContextItem.static.label = OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberdialog-title' );

ve.ui.MWTabberContextItem.static.modelClasses = [ ve.dm.MWTabberNode ];

ve.ui.MWTabberContextItem.static.commandName = 'mwTabber';

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MWTabberContextItem.prototype.getDescription = function () {
	return mw.message( 'tabberneue-visualeditor-mwtabberdialog-desc' ).parse();
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberContextItem.prototype.renderBody = function () {
	this.$body.empty().append( this.getDescription() );
};

/* Registration */

ve.ui.contextItemFactory.register( ve.ui.MWTabberContextItem );
