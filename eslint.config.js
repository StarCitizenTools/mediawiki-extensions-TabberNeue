'use strict';

const { defineConfig, globalIgnores } = require( 'eslint/config' );
const noJquery = require( 'eslint-plugin-no-jquery' );
const wikimedia = require( 'eslint-config-wikimedia/flat' );

module.exports = defineConfig( [
	globalIgnores( [
		'docs/',
		'i18n/',
		'vendor/'
	] ),

	// modules/ runs in the browser and has its own config below
	{
		ignores: [ 'modules/**' ],
		extends: [ wikimedia( 'server' ) ]
	},
	{
		files: [ 'vitest.config.js' ],
		languageOptions: {
			sourceType: 'module'
		},
		rules: {
			'n/no-missing-require': 'off'
		}
	},
	{
		files: [ 'tests/vitest/**/*.js' ],
		languageOptions: {
			globals: {
				vi: 'readonly',
				describe: 'readonly',
				it: 'readonly',
				expect: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly'
			}
		},
		rules: {
			'n/no-missing-require': 'off',
			'no-undef': 'off',
			strict: 'off',
			'no-underscore-dangle': 'off'
		}
	},

	// Code which runs in MediaWiki
	{
		files: [ 'modules/**' ],
		extends: [ wikimedia( 'client/es6', 'mediawiki' ) ],
		languageOptions: {
			sourceType: 'module'
		},
		rules: {
			'jsdoc/no-undefined-types': 'off',
			'max-len': 'off'
		}
	},
	{
		files: [ 'modules/ext.tabberNeue/**' ],
		extends: [ noJquery.configs[ 'flat/all' ] ],
		languageOptions: {
			ecmaVersion: 2017
		},
		rules: {
			'es-x/no-async-functions': 'off'
		}
	},
	{
		files: [ 'modules/ve-tabberNeue/**' ],
		extends: [ wikimedia( 'jquery' ) ],
		languageOptions: {
			// wikimedia() resets .js files to scripts
			sourceType: 'module',
			globals: {
				OO: 'readonly',
				ve: 'readonly'
			}
		}
	}
] );
