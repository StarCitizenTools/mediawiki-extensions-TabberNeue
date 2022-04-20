/**
 * ContentEditable MediaWiki Tabber node.
 *
 * @class
 * @extends ve.ce.MWBlockExtensionNode
 *
 * @constructor
 * @param {ve.dm.MWTabberNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.MWTabberNode = function VeCeMWTabberNode() {
	// Parent constructor
	ve.ce.MWTabberNode.super.apply( this, arguments );

	// DOM changes
	this.$element.addClass( 've-ce-mwTabberNode' );
};

/* Inheritance */

OO.inheritClass( ve.ce.MWTabberNode, ve.ce.MWBlockExtensionNode );

/* Static Properties */

ve.ce.MWTabberNode.static.name = 'mwTabber';

ve.ce.MWTabberNode.static.tagName = 'div';

ve.ce.MWTabberNode.static.primaryCommandName = 'tabber';

ve.ce.MWTabberNode.static.iconWhenInvisible = 'tabber';

/* Registration */

ve.ce.nodeFactory.register( ve.ce.MWTabberNode );
