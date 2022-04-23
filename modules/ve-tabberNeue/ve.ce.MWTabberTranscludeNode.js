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

/* Methods */

var lastHeader;

/**
 * @inheritdoc
 */
ve.ce.MWTabberTranscludeNode.prototype.onSetup = function () {
	// Parent method
	ve.ce.MWTabberTranscludeNode.super.prototype.onSetup.call( this );

	var tabber = this.$element[ 0 ];

	// Do not render header if it is already rendered
	if (
		tabber.firstElementChild &&
        tabber.firstElementChild !== lastHeader &&
        !tabber.classList.contains( 'tabber--live' ) &&
        tabber.classList.contains( 'tabber' )
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
	var tabPanels = tabber.querySelectorAll( ':scope > .tabber__section > .tabber__panel' ),
		container = document.createElement( 'header' ),
		tabList = document.createElement( 'nav' ),
		fragment = new DocumentFragment();

	Array.prototype.forEach.call( tabPanels, function ( tabPanel, index ) {
		var tab = document.createElement( 'a' );

		tab.innerText = tabPanel.title;
		tab.classList.add( 'tabber__tab' );

		// Make first tab active
		if ( index === 0 ) {
			tab.classList.add( 'tabber__tab--active' );
		}

		fragment.append( tab );
	} );

	tabList.append( fragment );

	container.classList.add( 'tabber__header' );
	tabList.classList.add( 'tabber__tabs' );

	container.append( tabList );
	tabber.prepend( container );

	tabber.classList.add( 'tabber--live' );

	lastHeader = tabber.firstElementChild;
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.MWTabberTranscludeNode );
