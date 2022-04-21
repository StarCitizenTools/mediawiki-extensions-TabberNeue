/**
 * DataModel MediaWiki Tabber node.
 *
 * @class
 * @extends ve.dm.MWBlockExtensionNode
 *
 * @constructor
 * @param {Object} [element] Reference to element in linear model
 */
ve.dm.MWTabberNode = function VeDmMWTabberNode() {
	// Parent constructor
	ve.dm.MWTabberNode.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.MWTabberNode, ve.dm.MWBlockExtensionNode );

/* Static members */

ve.dm.MWTabberNode.static.name = 'mwTabber';

ve.dm.MWTabberNode.static.tagName = 'div';

ve.dm.MWTabberNode.static.extensionName = 'tabber';

/* Registration */

ve.dm.modelRegistry.register( ve.dm.MWTabberNode );
