/**
 * VisualEditor UserInterface MWTabberBaseDialog class.
 *
 * Base class for Tabber and TabberTransclude dialogs.
 *
 * @class
 * @abstract
 * @extends ve.ui.MWExtensionDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MWTabberBaseDialog = function VeUiMWTabberBaseDialog() {
	// Parent constructor
	ve.ui.MWTabberBaseDialog.super.apply( this, arguments );

	// Properties
	this.tabPanels = [];
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberBaseDialog, ve.ui.MWExtensionDialog );

/* Static Properties */

ve.ui.MWTabberBaseDialog.static.size = 'larger';

ve.ui.MWTabberBaseDialog.static.actions = [
	{
		action: 'save',
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-apply' ),
		flags: [ 'progressive', 'primary' ],
		modes: [ 'edit', 'insert' ]
	},
	{
		action: 'cancel',
		label: OO.ui.deferMsg( 'visualeditor-dialog-action-cancel' ),
		flags: [ 'safe', 'close' ],
		modes: [ 'edit', 'insert' ]
	}
];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MWTabberBaseDialog.prototype.initialize = function () {
	// Parent method
	ve.ui.MWTabberBaseDialog.super.prototype.initialize.call( this );

	// Tab select widget for navigation
	this.tabSelectWidget = new OO.ui.TabSelectWidget( {
		classes: [ 've-ui-mwTabberDialog-tabSelect' ]
	} );
	this.tabSelectWidget.connect( this, { select: 'onTabSelect' } );

	// Wrap tab select in scrollable container
	const $tabSelectWrapper = $( '<div>' )
		.addClass( 've-ui-mwTabberDialog-tabSelectWrapper' )
		.append( this.tabSelectWidget.$element );

	// "Add Tab" button
	this.addTabButton = new OO.ui.ButtonWidget( {
		icon: 'add',
		label: this.getAddTabLabel(),
		flags: [ 'progressive' ],
		framed: false
	} );
	this.addTabButton.connect( this, { click: 'onAddTabClick' } );

	// Sticky header with tabs and add button
	const $stickyHeader = $( '<div>' )
		.addClass( 've-ui-mwTabberDialog-stickyHeader' )
		.append(
			$tabSelectWrapper,
			this.addTabButton.$element
		);

	// Container for tab panels
	this.tabContainer = new OO.ui.StackLayout( {
		continuous: false,
		expanded: false,
		classes: [ 've-ui-mwTabberDialog-tabContainer' ]
	} );

	// Panel to hold everything
	const panel = new OO.ui.PanelLayout( {
		expanded: false,
		padded: true,
		classes: [ 've-ui-mwTabberDialog-panel' ]
	} );

	panel.$element.append( this.tabContainer.$element );

	this.$body
		.addClass( 've-ui-mwTabberDialog-content' )
		.append( $stickyHeader, panel.$element );
};

/**
 * Get label for add tab button (to be overridden by subclasses).
 *
 * @abstract
 * @return {string} Label message
 */
ve.ui.MWTabberBaseDialog.prototype.getAddTabLabel = function () {
	throw new Error( 'getAddTabLabel must be implemented by subclass' );
};

/**
 * Get default tab label (to be overridden by subclasses).
 *
 * @abstract
 * @param {number} tabNumber Tab number
 * @return {string} Default label
 */
ve.ui.MWTabberBaseDialog.prototype.getDefaultTabLabel = function ( /* tabNumber */ ) {
	throw new Error( 'getDefaultTabLabel must be implemented by subclass' );
};

/**
 * Create field layouts for tab panel (to be implemented by subclasses).
 *
 * @abstract
 * @param {Object} tabPanel Tab panel object
 * @return {Array} Array of field layouts
 */
ve.ui.MWTabberBaseDialog.prototype.createTabFields = function ( /* tabPanel */ ) {
	throw new Error( 'createTabFields must be implemented by subclass' );
};

/**
 * Parse wikitext to extract tabs (to be implemented by subclasses).
 *
 * @abstract
 * @param {string} wikitext Wikitext to parse
 * @return {Array} Array of tab objects
 */
ve.ui.MWTabberBaseDialog.prototype.parseTabsFromWikitext = function ( /* wikitext */ ) {
	throw new Error( 'parseTabsFromWikitext must be implemented by subclass' );
};

/**
 * Convert tabs to wikitext (to be implemented by subclasses).
 *
 * @abstract
 * @return {string} Wikitext representation
 */
ve.ui.MWTabberBaseDialog.prototype.convertTabsToWikitext = function () {
	throw new Error( 'convertTabsToWikitext must be implemented by subclass' );
};

/**
 * Validate all tabs (to be implemented by subclasses).
 *
 * @abstract
 * @return {jQuery.Promise} Promise resolving to validation result
 */
ve.ui.MWTabberBaseDialog.prototype.validateAllTabs = function () {
	throw new Error( 'validateAllTabs must be implemented by subclass' );
};

/**
 * Get label placeholder text (to be overridden by subclasses).
 *
 * @abstract
 * @return {Function} Deferred message function
 */
ve.ui.MWTabberBaseDialog.prototype.getLabelPlaceholder = function () {
	throw new Error( 'getLabelPlaceholder must be implemented by subclass' );
};

/**
 * Get action button configuration (to be overridden by subclasses)
 *
 * @abstract
 * @return {Object} Button configuration with message keys
 */
ve.ui.MWTabberBaseDialog.prototype.getActionButtonConfig = function () {
	throw new Error( 'getActionButtonConfig must be implemented by subclass' );
};

/**
 * Get tab data for duplication (to be implemented by subclasses)
 *
 * @abstract
 * @param {Object} tabPanel Tab panel to duplicate
 * @return {Mixed} Data to pass to createTabPanel
 */
ve.ui.MWTabberBaseDialog.prototype.getTabDataForDuplication = function ( /* tabPanel */ ) {
	throw new Error( 'getTabDataForDuplication must be implemented by subclass' );
};

/**
 * Get empty tab data (to be implemented by subclasses)
 *
 * @abstract
 * @return {Object} Empty tab data
 */
ve.ui.MWTabberBaseDialog.prototype.getEmptyTabData = function () {
	throw new Error( 'getEmptyTabData must be implemented by subclass' );
};

/**
 * Create tab panel from parsed data (to be implemented by subclasses)
 *
 * @abstract
 * @param {Object} data Tab data
 * @return {Object} Tab panel
 */
ve.ui.MWTabberBaseDialog.prototype.createTabPanelFromData = function ( /* data */ ) {
	throw new Error( 'createTabPanelFromData must be implemented by subclass' );
};

/**
 * Show validation error (to be implemented by subclasses)
 *
 * @abstract
 * @param {Object} result Validation result
 */
ve.ui.MWTabberBaseDialog.prototype.showValidationError = function ( /* result */ ) {
	throw new Error( 'showValidationError must be implemented by subclass' );
};

/**
 * Get new node data (to be implemented by subclasses)
 *
 * @abstract
 * @param {string} wikitext Wikitext content
 * @return {Object} Node data
 */
ve.ui.MWTabberBaseDialog.prototype.getNewNodeData = function ( /* wikitext */ ) {
	throw new Error( 'getNewNodeData must be implemented by subclass' );
};

/**
 * Create a new tab panel.
 *
 * @param {string} [label] Initial label value
 * @param {Mixed} [data] Additional data specific to tab type
 * @return {Object} The created tab panel object
 */
ve.ui.MWTabberBaseDialog.prototype.createTabPanel = function ( label, data ) {
	const tabPanel = {};
	const tabNumber = this.tabPanels.length + 1;
	const defaultLabel = label || this.getDefaultTabLabel( tabNumber );

	tabPanel.tabOption = new OO.ui.TabOptionWidget( {
		data: tabNumber,
		label: defaultLabel,
		classes: [ 've-ui-mwTabberDialog-tabOption' ]
	} );

	// Label input
	tabPanel.labelInput = new OO.ui.TextInputWidget( {
		value: label || '',
		required: true,
		validate: 'non-empty',
		placeholder: this.getLabelPlaceholder()
	} );

	// Update tab option label when input changes
	tabPanel.labelInput.connect( this, {
		change: [ 'onTabLabelChange', tabPanel ]
	} );

	// Create move/duplicate/remove buttons
	this.createTabActionButtons( tabPanel );

	// Create specific field layouts (implemented by subclasses)
	const fields = this.createTabFields( tabPanel, data );

	tabPanel.panel = new OO.ui.PanelLayout( {
		expanded: false,
		padded: false,
		framed: false,
		classes: [ 've-ui-mwTabberDialog-tabPanel' ],
		scrollable: true
	} );

	// Header with action buttons
	tabPanel.$title = $( '<span>' )
		.addClass( 've-ui-mwTabberDialog-tabPanel-title' )
		.text( this.getDefaultTabLabel( tabNumber ) );

	const $header = $( '<div>' )
		.addClass( 've-ui-mwTabberDialog-tabPanel-header' )
		.append(
			tabPanel.$title,
			$( '<div>' )
				.addClass( 've-ui-mwTabberDialog-tabPanel-actions' )
				.append(
					tabPanel.moveLeftButton.$element,
					tabPanel.moveRightButton.$element,
					tabPanel.duplicateButton.$element,
					tabPanel.removeButton.$element
				)
		);

	tabPanel.panel.$element.append( $header, ...fields.map( ( f ) => f.$element ) );

	return tabPanel;
};

/**
 * Create action buttons for tab panel.
 *
 * @param {Object} tabPanel Tab panel object
 */
ve.ui.MWTabberBaseDialog.prototype.createTabActionButtons = function ( tabPanel ) {
	const buttonConfig = this.getActionButtonConfig();

	// Move left button
	tabPanel.moveLeftButton = new OO.ui.ButtonWidget( {
		label: OO.ui.deferMsg( buttonConfig.moveLeft ),
		invisibleLabel: true,
		icon: 'previous',
		title: OO.ui.deferMsg( buttonConfig.moveLeft ),
		framed: false
	} );
	tabPanel.moveLeftButton.connect( this, {
		click: [ 'onMoveLeftClick', tabPanel ]
	} );

	// Move right button
	tabPanel.moveRightButton = new OO.ui.ButtonWidget( {
		label: OO.ui.deferMsg( buttonConfig.moveRight ),
		invisibleLabel: true,
		icon: 'next',
		title: OO.ui.deferMsg( buttonConfig.moveRight ),
		framed: false
	} );
	tabPanel.moveRightButton.connect( this, {
		click: [ 'onMoveRightClick', tabPanel ]
	} );

	// Duplicate button
	tabPanel.duplicateButton = new OO.ui.ButtonWidget( {
		label: OO.ui.deferMsg( buttonConfig.duplicate ),
		invisibleLabel: true,
		icon: 'copy',
		title: OO.ui.deferMsg( buttonConfig.duplicate ),
		framed: false
	} );
	tabPanel.duplicateButton.connect( this, {
		click: [ 'onDuplicateClick', tabPanel ]
	} );

	// Remove button
	tabPanel.removeButton = new OO.ui.ButtonWidget( {
		label: OO.ui.deferMsg( buttonConfig.remove ),
		invisibleLabel: true,
		icon: 'trash',
		title: OO.ui.deferMsg( buttonConfig.remove ),
		framed: false,
		flags: [ 'destructive' ]
	} );
	tabPanel.removeButton.connect( this, {
		click: [ 'onRemoveTabClick', tabPanel ]
	} );
};

/**
 * Handle tab select from navigation.
 *
 * @param {OO.ui.TabOptionWidget} item Selected tab option
 */
ve.ui.MWTabberBaseDialog.prototype.onTabSelect = function ( item ) {
	if ( !item ) {
		return;
	}

	const tabPanel = this.tabPanels.find( ( panel ) => panel.tabOption === item );

	if ( tabPanel ) {
		this.tabContainer.setItem( tabPanel.panel );
		this.updateSize();
	}
};

/**
 * Handle tab label input change.
 *
 * @param {Object} tabPanel The tab panel whose label changed
 */
ve.ui.MWTabberBaseDialog.prototype.onTabLabelChange = function ( tabPanel ) {
	const newLabel = tabPanel.labelInput.getValue().trim();
	const index = this.tabPanels.indexOf( tabPanel );

	if ( index !== -1 ) {
		const displayLabel = newLabel || this.getDefaultTabLabel( index + 1 );
		tabPanel.tabOption.setLabel( displayLabel );
	}
};

/**
 * Handle Move Left button click.
 *
 * @param {Object} tabPanel The tab panel to move
 */
ve.ui.MWTabberBaseDialog.prototype.onMoveLeftClick = function ( tabPanel ) {
	const index = this.tabPanels.indexOf( tabPanel );

	if ( index > 0 ) {
		// Swap using destructuring
		[ this.tabPanels[ index - 1 ], this.tabPanels[ index ] ] =
		[ this.tabPanels[ index ], this.tabPanels[ index - 1 ] ];

		this.rebuildNavigation();
		this.tabSelectWidget.selectItem( tabPanel.tabOption );
		this.tabContainer.setItem( tabPanel.panel );
		this.updateTabNumbers();
		this.updateMoveButtons();
	}
};

/**
 * Handle Move Right button click.
 *
 * @param {Object} tabPanel The tab panel to move
 */
ve.ui.MWTabberBaseDialog.prototype.onMoveRightClick = function ( tabPanel ) {
	const index = this.tabPanels.indexOf( tabPanel );

	if ( index < this.tabPanels.length - 1 ) {
		// Swap using destructuring
		[ this.tabPanels[ index ], this.tabPanels[ index + 1 ] ] =
		[ this.tabPanels[ index + 1 ], this.tabPanels[ index ] ];

		this.rebuildNavigation();
		this.tabSelectWidget.selectItem( tabPanel.tabOption );
		this.tabContainer.setItem( tabPanel.panel );
		this.updateTabNumbers();
		this.updateMoveButtons();
	}
};

/**
 * Handle Duplicate button click.
 *
 * @param {Object} tabPanel The tab panel to duplicate
 */
ve.ui.MWTabberBaseDialog.prototype.onDuplicateClick = function ( tabPanel ) {
	const index = this.tabPanels.indexOf( tabPanel );
	const label = tabPanel.labelInput.getValue();
	const newLabel = label ? label + ' (Copy)' : '';

	// Get additional data for duplication
	const data = this.getTabDataForDuplication( tabPanel );

	// Create new tab with copied content
	const newTabPanel = this.createTabPanel( newLabel, data );

	// Insert after current tab
	this.tabPanels.splice( index + 1, 0, newTabPanel );

	this.rebuildNavigation();
	this.tabSelectWidget.selectItem( newTabPanel.tabOption );
	this.tabContainer.setItem( newTabPanel.panel );
	this.updateTabNumbers();
	this.updateMoveButtons();
	this.updateSize();

	// Focus on the new tab's label input
	newTabPanel.labelInput.focus();
};

/**
 * Rebuild navigation widgets in current order
 */
ve.ui.MWTabberBaseDialog.prototype.rebuildNavigation = function () {
	const tabOptions = this.tabPanels.map( ( tabPanel ) => tabPanel.tabOption );

	this.tabSelectWidget.clearItems();
	this.tabContainer.clearItems();

	this.tabSelectWidget.addItems( tabOptions );
	this.tabPanels.forEach( ( tabPanel ) => {
		this.tabContainer.addItems( [ tabPanel.panel ] );
	} );
};

/**
 * Update Move button states based on tab position
 */
ve.ui.MWTabberBaseDialog.prototype.updateMoveButtons = function () {
	this.tabPanels.forEach( ( tabPanel, index ) => {
		tabPanel.moveLeftButton.setDisabled( index === 0 );
		tabPanel.moveRightButton.setDisabled( index === this.tabPanels.length - 1 );
	} );
};

/**
 * Handle Add Tab button click
 */
ve.ui.MWTabberBaseDialog.prototype.onAddTabClick = function () {
	const tabPanel = this.createTabPanel();
	this.tabPanels.push( tabPanel );

	this.tabSelectWidget.addItems( [ tabPanel.tabOption ] );
	this.tabContainer.addItems( [ tabPanel.panel ] );
	this.tabSelectWidget.selectItem( tabPanel.tabOption );
	this.tabContainer.setItem( tabPanel.panel );

	this.updateMoveButtons();
	this.updateSize();

	tabPanel.labelInput.focus();
};

/**
 * Handle Remove Tab button click.
 *
 * @param {Object} tabPanel The tab panel to remove
 */
ve.ui.MWTabberBaseDialog.prototype.onRemoveTabClick = function ( tabPanel ) {
	const index = this.tabPanels.indexOf( tabPanel );

	if ( index === -1 || this.tabPanels.length === 1 ) {
		return;
	}

	this.tabPanels.splice( index, 1 );
	this.tabSelectWidget.removeItems( [ tabPanel.tabOption ] );
	this.tabContainer.removeItems( [ tabPanel.panel ] );

	// Select the previous tab or the first tab
	const newIndex = Math.max( 0, index - 1 );
	if ( this.tabPanels[ newIndex ] ) {
		this.tabSelectWidget.selectItem( this.tabPanels[ newIndex ].tabOption );
		this.tabContainer.setItem( this.tabPanels[ newIndex ].panel );
	}

	this.updateTabNumbers();
	this.updateMoveButtons();
	this.updateSize();
};

/**
 * Update tab numbers in headers and navigation.
 */
ve.ui.MWTabberBaseDialog.prototype.updateTabNumbers = function () {
	this.tabPanels.forEach( ( tabPanel, index ) => {
		const tabNumber = index + 1;

		// Update cached title element
		if ( tabPanel.$title ) {
			tabPanel.$title.text( this.getDefaultTabLabel( tabNumber ) );
		}

		tabPanel.tabOption.setData( tabNumber );

		const currentLabel = tabPanel.labelInput.getValue().trim();
		if ( !currentLabel ) {
			tabPanel.tabOption.setLabel( this.getDefaultTabLabel( tabNumber ) );
		}
	} );
};

/**
 * Get setup process.
 *
 * @param {Object} data Dialog data
 * @return {OO.ui.Process}
 */
ve.ui.MWTabberBaseDialog.prototype.getSetupProcess = function ( data ) {
	return ve.ui.MWTabberBaseDialog.super.prototype.getSetupProcess.call( this, data )
		.next( () => {
			let wikitext = '';

			if ( this.selectedNode ) {
				const mwData = this.selectedNode.getAttribute( 'mw' );
				if ( mwData && mwData.body && mwData.body.extsrc !== undefined ) {
					wikitext = mwData.body.extsrc;
				}
			}

			// Clear existing tabs
			this.tabPanels.forEach( ( tabPanel ) => {
				this.tabSelectWidget.removeItems( [ tabPanel.tabOption ] );
				this.tabContainer.removeItems( [ tabPanel.panel ] );
			} );
			this.tabPanels = [];

			// Parse and create tabs
			const tabs = this.parseTabsFromWikitext( wikitext );

			if ( tabs.length === 0 ) {
				tabs.push( this.getEmptyTabData() );
			}

			tabs.forEach( ( tab ) => {
				const tabPanel = this.createTabPanelFromData( tab );
				this.tabPanels.push( tabPanel );
				this.tabSelectWidget.addItems( [ tabPanel.tabOption ] );
				this.tabContainer.addItems( [ tabPanel.panel ] );
			} );

			// Select the first tab
			if ( this.tabPanels.length > 0 ) {
				this.tabSelectWidget.selectItem( this.tabPanels[ 0 ].tabOption );
				this.tabContainer.setItem( this.tabPanels[ 0 ].panel );
			}

			this.updateMoveButtons();
			this.updateSize();
		} );
};

/**
 * Get teardown process.
 *
 * @param {Object} data Dialog data
 * @return {OO.ui.Process}
 */
ve.ui.MWTabberBaseDialog.prototype.getTeardownProcess = function ( data ) {
	return ve.ui.MWTabberBaseDialog.super.prototype.getTeardownProcess.call( this, data )
		.first( () => {
			this.tabPanels.forEach( ( tabPanel ) => {
				this.tabSelectWidget.removeItems( [ tabPanel.tabOption ] );
				this.tabContainer.removeItems( [ tabPanel.panel ] );
			} );
			this.tabPanels = [];
		} );
};

/**
 * Get action process for the dialog.
 *
 * @param {string} action Action name
 * @return {OO.ui.Process}
 */
ve.ui.MWTabberBaseDialog.prototype.getActionProcess = function ( action ) {
	if ( action === 'save' ) {
		return new OO.ui.Process( () => {
			this.validateAllTabs()
				.then( ( result ) => {
					if ( !result.valid ) {
						this.showValidationError( result );
						return $.Deferred().reject().promise();
					}

					const newWikitext = this.convertTabsToWikitext();
					let mwData;

					if ( this.selectedNode ) {
						mwData = ve.copy( this.selectedNode.getAttribute( 'mw' ) );
						mwData.body.extsrc = newWikitext;
						this.fragment.changeAttributes( { mw: mwData } );
					} else {
						mwData = this.getNewNodeData( newWikitext );
						this.fragment.insertContent( [
							{
								type: this.constructor.static.modelClasses[ 0 ].static.name,
								attributes: { mw: mwData }
							},
							{ type: '/' + this.constructor.static.modelClasses[ 0 ].static.name }
						] );
					}

					this.close( { action: 'save' } );
				} );
		} );
	} else if ( action === 'cancel' ) {
		return new OO.ui.Process( () => {
			this.close( { action: 'cancel' } );
		} );
	}

	return ve.ui.MWTabberBaseDialog.super.prototype.getActionProcess.call( this, action );
};
