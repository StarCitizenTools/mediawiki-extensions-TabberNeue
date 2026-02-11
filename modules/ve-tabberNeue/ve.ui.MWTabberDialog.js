/**
 * VisualEditor UserInterface MWTabberDialog class.
 *
 * @class
 * @extends ve.ui.MWTabberBaseDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MWTabberDialog = function VeUiMWTabberDialog() {
	// Parent constructor
	ve.ui.MWTabberDialog.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberDialog, ve.ui.MWTabberBaseDialog );

/* Static properties */

ve.ui.MWTabberDialog.static.name = 'mwTabber';

ve.ui.MWTabberDialog.static.title =
	OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberdialog-title' );

ve.ui.MWTabberDialog.static.modelClasses = [ ve.dm.MWTabberNode ];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.getAddTabLabel = function () {
	return OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberdialog-addtab' );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.getDefaultTabLabel = function ( tabNumber ) {
	return OO.ui.msg( 'tabberneue-visualeditor-mwtabberdialog-tab', tabNumber );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.getLabelPlaceholder = function () {
	return OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberdialog-label-placeholder' );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.getActionButtonConfig = function () {
	return {
		moveLeft: 'tabberneue-visualeditor-mwtabberdialog-moveleft',
		moveRight: 'tabberneue-visualeditor-mwtabberdialog-moveright',
		duplicate: 'tabberneue-visualeditor-mwtabberdialog-duplicate',
		remove: 'tabberneue-visualeditor-mwtabberdialog-removetab'
	};
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.createTabFields = function ( tabPanel, content ) {
	// Content input
	tabPanel.contentInput = new OO.ui.MultilineTextInputWidget( {
		value: content || '',
		rows: 5,
		autosize: true,
		maxRows: 15,
		placeholder: OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberdialog-content-placeholder' )
	} );

	const labelField = new OO.ui.FieldLayout( tabPanel.labelInput, {
		label: OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberdialog-label' ),
		align: 'top'
	} );

	const contentField = new OO.ui.FieldLayout( tabPanel.contentInput, {
		label: OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabberdialog-content' ),
		align: 'top'
	} );

	return [ labelField, contentField ];
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.parseTabsFromWikitext = function ( wikitext ) {
	const tabs = [];

	if ( !wikitext ) {
		return tabs;
	}

	// Split by tab separator |-|
	const tabParts = wikitext.split( '|-|' );

	tabParts.forEach( function ( part ) {
		const trimmedPart = part.trim();
		if ( !trimmedPart ) {
			return;
		}

		// Find the first = sign to split label and content
		const equalSignIndex = trimmedPart.indexOf( '=' );

		if ( equalSignIndex !== -1 ) {
			const label = trimmedPart.slice( 0, Math.max( 0, equalSignIndex ) ).trim();
			const content = trimmedPart.slice( Math.max( 0, equalSignIndex + 1 ) ).trim();

			tabs.push( { label, content } );
		}
	} );

	return tabs;
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.convertTabsToWikitext = function () {
	const wikitextParts = [];

	this.tabPanels.forEach( function ( tabPanel ) {
		const label = tabPanel.labelInput.getValue().trim();
		const content = tabPanel.contentInput.getValue().trim();

		if ( label || content ) {
			wikitextParts.push( '|-|' + label + ' =\n' + content );
		}
	} );

	return '\n' + wikitextParts.join( '\n' ) + '\n';
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.getTabDataForDuplication = function ( tabPanel ) {
	return tabPanel.contentInput.getValue();
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.getEmptyTabData = function () {
	return { label: '', content: '' };
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.createTabPanelFromData = function ( data ) {
	return this.createTabPanel( data.label, data.content );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.validateAllTabs = function () {
	const deferred = $.Deferred();
	const invalidTabs = [];
	// const duplicateLabels = new Map();
	const promises = [];

	this.tabPanels.forEach( function ( tabPanel, index ) {
		const promise = tabPanel.labelInput.getValidity().then(
			function () {
				tabPanel.labelInput.setValidityFlag( true );
				
				// Check for duplicate labels
				// const label = tabPanel.labelInput.getValue().trim();
				// if ( label ) {
				// 	if ( !duplicateLabels.has( label ) ) {
				// 		duplicateLabels.set( label, [] );
				// 	}
				// 	duplicateLabels.get( label ).push( index + 1 );
				// }
			},
			function () {
				tabPanel.labelInput.setValidityFlag( false );
				invalidTabs.push( index + 1 );
			}
		);
		promises.push( promise );
	} );

	$.when.apply( $, promises ).always( function () {
		// Find actual duplicates (labels used more than once)
		// const duplicates = [];
		// duplicateLabels.forEach( function ( indices, label ) {
		// 	if ( indices.length > 1 ) {
		// 		duplicates.push( { label, tabs: indices } );
		// 	}
		// } );

		deferred.resolve( {
			valid: invalidTabs.length === 0 /* && duplicates.length === 0 */,
			invalidTabs
			// duplicateLabels: duplicates
		} );
	} );

	return deferred.promise();
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.showValidationError = function ( result ) {
	let errorMessage = '';

	if ( result.invalidTabs.length > 0 ) {
		errorMessage = OO.ui.msg(
			'tabberneue-visualeditor-mwtabberdialog-error-empty-label',
			result.invalidTabs.join( ', ' )
		);
	}

	// if ( result.duplicateLabels && result.duplicateLabels.length > 0 ) {
	// 	const duplicateMessages = result.duplicateLabels.map( function ( dup ) {
	// 		OO.ui.msg(
	// 			'tabberneue-error-tabs-duplicate-label',
	// 			dup.label
	// 		) + ' (' + dup.tabs.join( ', ' ) + ')'
	// 	} );

	// 	if ( errorMessage ) {
	// 		errorMessage += '\n\n';
	// 	}
	// 	errorMessage += duplicateMessages.join( '\n' );
	// }

	OO.ui.alert( errorMessage, {
		title: OO.ui.msg( 'tabberneue-visualeditor-mwtabberdialog-error-title' ),
		size: 'medium'
	} );

	// Focus first invalid tab
	const firstInvalidIndex = result.invalidTabs[ 0 ] - 1;
	if ( this.tabPanels[ firstInvalidIndex ] ) {
		const tabPanel = this.tabPanels[ firstInvalidIndex ];
		this.tabSelectWidget.selectItem( tabPanel.tabOption );
		this.tabContainer.setItem( tabPanel.panel );
		tabPanel.labelInput.focus();
	}
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberDialog.prototype.getNewNodeData = function ( wikitext ) {
	return {
		name: 'tabber',
		attrs: {},
		body: {
			extsrc: wikitext
		}
	};
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.MWTabberDialog );
