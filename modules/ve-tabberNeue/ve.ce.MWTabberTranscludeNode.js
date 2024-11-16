/**
 * ContentEditable MediaWiki TabberTransclude node.
 *
 * @class
 * @extends ve.ce.MWBlockExtensionNode
 *
 * @constructor
 * @param {ve.dm.MWTabberTranscludeNode} model Model to observe
 * @param {Object} [config] Configuration options
 */
ve.ce.MWTabberTranscludeNode = function VeCeMWTabberTranscludeNode() {
	// Parent constructor
	ve.ce.MWTabberTranscludeNode.super.apply( this, arguments );

	this.renderHeader = OO.ui.debounce( this.renderHeader.bind( this ), 300 );

	// DOM changes
	this.$element.addClass( 've-ce-mwTabberTranscludeNode' );
};

/* Inheritance */

OO.inheritClass( ve.ce.MWTabberTranscludeNode, ve.ce.MWBlockExtensionNode );

/* Static Properties */

ve.ce.MWTabberTranscludeNode.static.name = 'mwTabberTransclude';

ve.ce.MWTabberTranscludeNode.static.tagName = 'div';

ve.ce.MWTabberTranscludeNode.static.primaryCommandName = 'mwTabberTransclude';

ve.ce.MWTabberTranscludeNode.static.lastHeader = null;

/* Methods */
/**
 * @inheritdoc
 */
ve.ce.MWTabberTranscludeNode.prototype.onSetup = function () {
	// Parent method
	ve.ce.MWTabberTranscludeNode.super.prototype.onSetup.call( this );

	const tabber = this.$element[ 0 ];
	const needsInit = tabber.classList.contains( 'tabber--init' );
	const isNewHeader = tabber.firstElementChild !== ve.ce.MWTabberNode.static.lastHeader;

	// Do not render header if it is already rendered
	if ( needsInit && isNewHeader
	) {
		this.renderHeader( tabber );
	}
};

/**
 * HACK: Render a simple static tab header for preview
 *
 * Since it is only for preview it does not have to be fancy,
 * just having the right HTML and CSS will be sufficient
 *
 * @param {HTMLElement} tabber
 */
ve.ce.MWTabberTranscludeNode.prototype.renderHeader = function ( tabber ) {
	const nestedTabbers = tabber.querySelectorAll( '.tabber__panel:first-child .tabber' );
	const renderSingleHeader = function ( element ) {
		const firstTab = element.querySelector( ':scope > .tabber__header > .tabber__tabs > .tabber__tab' );
		if ( firstTab ) {
			firstTab.setAttribute( 'aria-selected', 'true' );
		}
	};

	if ( nestedTabbers.length > 0 ) {
		Array.prototype.forEach.call( nestedTabbers, ( nestedTabber ) => {
			renderSingleHeader( nestedTabber );
		} );
	}

	renderSingleHeader( tabber );
	ve.ce.MWTabberNode.static.lastHeader = tabber.firstElementChild;
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.MWTabberTranscludeNode );
