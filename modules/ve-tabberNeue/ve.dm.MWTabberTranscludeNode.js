/**
 * DataModel MediaWiki TabberTransclude node.
 *
 * @class
 * @extends ve.dm.MWBlockExtensionNode
 *
 * @constructor
 * @param {Object} [element] Reference to element in linear model
 */
ve.dm.MWTabberTranscludeNode = function VeDmMWTabberTranscludeNode() {
	// Parent constructor
	ve.dm.MWTabberTranscludeNode.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.dm.MWTabberTranscludeNode, ve.dm.MWBlockExtensionNode );

/* Static members */

ve.dm.MWTabberTranscludeNode.static.name = 'mwTabberTransclude';

ve.dm.MWTabberTranscludeNode.static.tagName = 'div';

ve.dm.MWTabberTranscludeNode.static.extensionName = 'tabbertransclude';

/* Registration */

ve.dm.modelRegistry.register( ve.dm.MWTabberTranscludeNode );
