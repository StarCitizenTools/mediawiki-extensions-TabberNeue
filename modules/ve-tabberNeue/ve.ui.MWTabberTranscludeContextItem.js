/**
 * VisualEditor MWTabberTranscludeContextItem class.
 *
 * @class
 * @extends ve.ui.LinearContextItem
 *
 * @constructor
 * @param {ve.ui.Context} context Context item is in
 * @param {ve.dm.Model} model Model item is related to
 * @param {Object} config Configuration options
 */
ve.ui.MWTabberTranscludeContextItem = function VeUiMWTabberTranscludeContextItem() {
	// Parent constructor
	ve.ui.MWTabberTranscludeContextItem.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberTranscludeContextItem, ve.ui.LinearContextItem );

/* Static Properties */

ve.ui.MWTabberTranscludeContextItem.static.name = 'mwTabberTransclude';

ve.ui.MWTabberTranscludeContextItem.static.icon = 'tabber';

ve.ui.MWTabberTranscludeContextItem.static.label = OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-title' );

ve.ui.MWTabberTranscludeContextItem.static.modelClasses = [ ve.dm.MWTabberTranscludeNode ];

ve.ui.MWTabberTranscludeContextItem.static.commandName = 'mwTabberTransclude';

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeContextItem.prototype.getDescription = function () {
	return mw.message( 'tabberneue-visualeditor-mwtabbertranscludeinspector-desc' ).parse();
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeContextItem.prototype.renderBody = function () {
	this.$body.empty().append( this.getDescription() );
};

/* Registration */

ve.ui.contextItemFactory.register( ve.ui.MWTabberTranscludeContextItem );
