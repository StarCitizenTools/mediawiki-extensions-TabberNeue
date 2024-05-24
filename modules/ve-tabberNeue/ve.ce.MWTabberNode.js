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

	this.renderHeader = OO.ui.debounce( this.renderHeader.bind( this ), 300 );

	// DOM changes
	this.$element.addClass( 've-ce-mwTabberNode' );
};

/* Inheritance */

OO.inheritClass( ve.ce.MWTabberNode, ve.ce.MWBlockExtensionNode );

/* Static Properties */

ve.ce.MWTabberNode.static.name = 'mwTabber';

ve.ce.MWTabberNode.static.tagName = 'div';

ve.ce.MWTabberNode.static.primaryCommandName = 'mwTabber';

/* Methods */
// eslint-disable-next-line no-var
var lastHeader;

/**
 * @inheritdoc
 */
ve.ce.MWTabberNode.prototype.onSetup = function () {
	// Parent method
	ve.ce.MWTabberNode.super.prototype.onSetup.call( this );

	const tabber = this.$element[ 0 ];

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
ve.ce.MWTabberNode.prototype.renderHeader = function ( tabber ) {
	const nestedTabbers = tabber.querySelectorAll( '.tabber__panel:first-child .tabber' );

	const renderSingleHeader = function ( element ) {
		const
			tabPanels = element.querySelectorAll( ':scope > .tabber__section > .tabber__panel' ),
			header = element.querySelector( ':scope > .tabber__header' ),
			tabList = document.createElement( 'nav' ),
			indicator = document.createElement( 'div' ),
			fragment = new DocumentFragment();

		Array.prototype.forEach.call( tabPanels, function ( tabPanel, index ) {
			const tab = document.createElement( 'a' );

			tab.innerText = tabPanel.getAttribute( 'data-mw-tabber-title' );
			tab.classList.add( 'tabber__tab' );

			// Make first tab active
			if ( index === 0 ) {
				tab.setAttribute( 'aria-selected', true );
			}

			fragment.append( tab );
		} );

		tabList.append( fragment );

		tabList.classList.add( 'tabber__tabs' );
		indicator.classList.add( 'tabber__indicator' );

		header.append( tabList, indicator );

		indicator.style.width = tabList.firstElementChild.offsetWidth + 'px';

		element.classList.add( 'tabber--live' );
	};

	if ( nestedTabbers.length > 0 ) {
		Array.prototype.forEach.call( nestedTabbers, function ( nestedTabber ) {
			renderSingleHeader( nestedTabber );
		} );
	}

	renderSingleHeader( tabber );

	lastHeader = tabber.firstElementChild;
};

/* Registration */

ve.ce.nodeFactory.register( ve.ce.MWTabberNode );
