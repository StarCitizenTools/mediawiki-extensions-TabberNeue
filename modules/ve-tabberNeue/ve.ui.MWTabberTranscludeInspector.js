/**
 * VisualEditor UserInterface MWTabberTranscludeInspector class.
 *
 * @class
 * @extends ve.ui.MWTabberBaseDialog
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MWTabberTranscludeInspector = function VeUiMWTabberTranscludeInspector() {
	// Parent constructor
	ve.ui.MWTabberTranscludeInspector.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( ve.ui.MWTabberTranscludeInspector, ve.ui.MWTabberBaseDialog );

/* Static properties */

ve.ui.MWTabberTranscludeInspector.static.name = 'mwTabberTransclude';

ve.ui.MWTabberTranscludeInspector.static.title =
	OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-title' );

ve.ui.MWTabberTranscludeInspector.static.modelClasses = [ ve.dm.MWTabberTranscludeNode ];

/* Methods */

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeInspector.prototype.getAddTabLabel = function () {
	return OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-addtab' );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeInspector.prototype.getDefaultTabLabel = function ( tabNumber ) {
	return OO.ui.msg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-tab', tabNumber );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeInspector.prototype.getLabelPlaceholder = function () {
	return OO.ui.deferMsg( 'tabberneue-visualeditor-mwtabbertranscludeinspector-label-placeholder' );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeInspector.prototype.getActionButtonConfig = function () {
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
ve.ui.MWTabberTranscludeInspector.prototype.createTabFields = function ( tabPanel, page ) {
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
ve.ui.MWTabberTranscludeInspector.prototype.parseTabsFromWikitext = function ( wikitext ) {
	const tabs = [];

	if ( !wikitext ) {
		return tabs;
	}

	// Split by newlines
	const lines = wikitext.split( '\n' );

	lines.forEach( function ( line ) {
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
ve.ui.MWTabberTranscludeInspector.prototype.convertTabsToWikitext = function () {
	const wikitextParts = [];

	this.tabPanels.forEach( function ( tabPanel ) {
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
ve.ui.MWTabberTranscludeInspector.prototype.getTabDataForDuplication = function ( tabPanel ) {
	return tabPanel.pageInput.getValue();
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeInspector.prototype.getEmptyTabData = function () {
	return { label: '', page: '' };
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeInspector.prototype.createTabPanelFromData = function ( data ) {
	return this.createTabPanel( data.label, data.page );
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeInspector.prototype.validateAllTabs = function () {
	const deferred = $.Deferred();
	const invalidLabels = [];
	const invalidPages = [];
	const promises = [];

	this.tabPanels.forEach( function ( tabPanel, index ) {
		// Validate label
		const labelPromise = tabPanel.labelInput.getValidity().then(
			function () {
				// Valid
				tabPanel.labelInput.setValidityFlag( true );
			},
			function () {
				// Invalid
				tabPanel.labelInput.setValidityFlag( false );
				invalidLabels.push( index + 1 );
			}
		);
		promises.push( labelPromise );

		// Validate page
		const pagePromise = tabPanel.pageInput.getValidity().then(
			function () {
				// Valid
				tabPanel.pageInput.setValidityFlag( true );
			},
			function () {
				// Invalid
				tabPanel.pageInput.setValidityFlag( false );
				invalidPages.push( index + 1 );
			}
		);
		promises.push( pagePromise );
	} );

	// Use .always() to run regardless of individual promise success/failure
	$.when.apply( $, promises ).always( function () {
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
ve.ui.MWTabberTranscludeInspector.prototype.showValidationError = function ( result ) {
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
		if ( result.invalidLabels.indexOf( firstInvalidIndex + 1 ) !== -1 ) {
			tabPanel.labelInput.focus();
		} else {
			tabPanel.pageInput.focus();
		}
	}
};

/**
 * @inheritdoc
 */
ve.ui.MWTabberTranscludeInspector.prototype.getNewNodeData = function ( wikitext ) {
	return {
		name: 'tabbertransclude',
		attrs: {},
		body: {
			extsrc: wikitext
		}
	};
};

/* Registration */

ve.ui.windowFactory.register( ve.ui.MWTabberTranscludeInspector );
