/**
 * VisualEditor UserInterface MWTabberTranscludeDialog class.
 *
 * @class
 * @extends ve.ui.MWTabberBaseDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MWTabberTranscludeDialog = function VeUiMWTabberTranscludeDialog() {
	// Parent constructor
	ve.ui.MWTabberTranscludeDialog.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberTranscludeDialog, ve.ui.MWTabberBaseDialog );

/* Static properties */

ve.ui.MWTabberTranscludeDialog.static.name = 'mwTabberTransclude';

ve.ui.MWTabberTranscludeDialog.static.dir = 'ltr';

ve.ui.MWTabberTranscludeDialog.static.title =
	OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-title' );

ve.ui.MWTabberTranscludeDialog.static.modelClasses = [ ve.dm.MWTabberTranscludeNode ];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.getAddTabLabel = function () {
	return OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-addtab' );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.getDefaultTabLabel = function ( tabNumber ) {
	return OO.ui.msg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-tab', tabNumber );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.getLabelPlaceholder = function () {
	return OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-label-placeholder' );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.getActionButtonConfig = function () {
	return {
		moveLeft: 'tabberneue-visualeditor-mwtabbertranscludeinspector-moveleft',
		moveRight: 'tabberneue-visualeditor-mwtabbertranscludeinspector-moveright',
		duplicate: 'tabberneue-visualeditor-mwtabbertranscludeinspector-duplicate',
		remove: 'tabberneue-visualeditor-mwtabbertranscludeinspector-removetab'
	};
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.createTabFields = function ( tabPanel, page ) {
	// Page name input with autocomplete
	tabPanel.pageInput = new mw.widgets.TitleInputWidget( {
		$overlay: this.$overlay,
		placeholder: OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-page-placeholder' ),
		value: page || '',
		validate: false,
		required: true,
		excludeCurrentPage: true,
		api: new mw.Api()
	} );

	const labelField = new OO.ui.FieldLayout( tabPanel.labelInput, {
		label: OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-label' ),
		align: 'top'
	} );

	const pageField = new OO.ui.FieldLayout( tabPanel.pageInput, {
		label: OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-page' ),
		align: 'top'
	} );

	return [ labelField, pageField ];
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.parseTabsFromWikitext = function ( wikitext ) {
	const tabs = [];

	if ( !wikitext ) {
		return tabs;
	}

	// Split by newlines
	const lines = wikitext.split( '\n' );

	lines.forEach( ( line ) => {
		const trimmedLine = line.trim();
		if ( !trimmedLine ) {
			return;
		}

		// Find the first | sign to split page and label
		const pipeIndex = trimmedLine.indexOf( '|' );

		if ( pipeIndex !== -1 ) {
			const page = trimmedLine.slice( 0, Math.max( 0, pipeIndex ) ).trim();
			const label = trimmedLine.slice( Math.max( 0, pipeIndex + 1 ) ).trim();

			tabs.push( {
				label: label,
				page: page
			} );
		}
	} );

	return tabs;
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.convertTabsToWikitext = function () {
	const wikitextParts = [];

	this.tabPanels.forEach( ( tabPanel ) => {
		const label = tabPanel.labelInput.getValue().trim();
		const page = tabPanel.pageInput.getValue().trim();

		if ( label && page ) {
			wikitextParts.push( page + '|' + label );
		}
	} );

	return wikitextParts.join( '\n' );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.getTabDataForDuplication = function ( tabPanel ) {
	return tabPanel.pageInput.getValue();
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.getEmptyTabData = function () {
	return { label: '', page: '' };
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.createTabPanelFromData = function ( data ) {
	return this.createTabPanel( data.label, data.page );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.validateAllTabs = function () {
	const deferred = $.Deferred();
	const invalidLabels = [];
	const invalidPages = [];
	const promises = [];

	this.tabPanels.forEach( ( tabPanel, index ) => {
		// Validate label
		const labelPromise = tabPanel.labelInput.getValidity().then(
			() => {
				// Valid
				tabPanel.labelInput.setValidityFlag( true );
			},
			() => {
				// Invalid
				tabPanel.labelInput.setValidityFlag( false );
				invalidLabels.push( index + 1 );
			}
		);
		promises.push( labelPromise );

		// Validate page
		const pagePromise = tabPanel.pageInput.getValidity().then(
			() => {
				// Valid
				tabPanel.pageInput.setValidityFlag( true );
			},
			() => {
				// Invalid
				tabPanel.pageInput.setValidityFlag( false );
				invalidPages.push( index + 1 );
			}
		);
		promises.push( pagePromise );
	} );

	// Use .always() to run regardless of individual promise success/failure
	$.when.apply( $, promises ).always( () => {
		deferred.resolve( {
			valid: invalidLabels.length === 0 && invalidPages.length === 0,
			invalidLabels: invalidLabels,
			invalidPages: invalidPages
		} );
	} );

	return deferred.promise();
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.showValidationError = function ( result ) {
	let errorMessage = '';

	// Build error message based on what's invalid
	if ( result.invalidLabels.length > 0 && result.invalidPages.length > 0 ) {
		errorMessage = OO.ui.msg(
			'tabberneue-visualeditor-mwtabbertranscludeinspector-error-empty-both',
			result.invalidLabels.join( ', ' ),
			result.invalidPages.join( ', ' )
		);
	} else if ( result.invalidLabels.length > 0 ) {
		errorMessage = OO.ui.msg(
			'tabberneue-visualeditor-mwtabbertranscludeinspector-error-empty-label',
			result.invalidLabels.join( ', ' )
		);
	} else if ( result.invalidPages.length > 0 ) {
		errorMessage = OO.ui.msg(
			'tabberneue-visualeditor-mwtabbertranscludeinspector-error-empty-page',
			result.invalidPages.join( ', ' )
		);
	}

	// Show error
	OO.ui.alert(
		errorMessage,
		{
			title: OO.ui.msg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-error-title' ),
			size: 'medium'
		}
	);

	// Focus first invalid tab and appropriate field
	const firstInvalidIndex = result.invalidLabels.length > 0 ?
		result.invalidLabels[ 0 ] - 1 :
		result.invalidPages[ 0 ] - 1;

	if ( this.tabPanels[ firstInvalidIndex ] ) {
		const tabPanel = this.tabPanels[ firstInvalidIndex ];
		this.tabSelectWidget.selectItem( tabPanel.tabOption );
		this.tabContainer.setItem( tabPanel.panel );

		// Focus the appropriate field
		// eslint-disable-next-line es-x/no-array-prototype-includes
		if ( result.invalidLabels.includes( firstInvalidIndex + 1 ) ) {
			tabPanel.labelInput.focus();
		} else {
			tabPanel.pageInput.focus();
		}
	}
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeDialog.prototype.getNewNodeData = function ( wikitext ) {
	return {
		name: 'tabbertransclude',
		attrs: {},
		body: {
			extsrc: wikitext
		}
	};
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.MWTabberTranscludeDialog );
