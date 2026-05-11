/**
 * Vitest setup file.
 *
 * - Assigns the mw mock to globalThis so production code that touches mw.*
 *   directly works in tests without per-file imports.
 * - Stubs $ as a minimal jQuery shim — only the parts that ext.tabberNeue
 *   touches via mw.hook( 'wikipage.content' ).fire( $( panel ) ).
 * - Redirects require('./config.json') from inside modules/ext.tabberNeue/
 *   to the mock config so production code reads predictable values.
 */

const Module = require( 'module' );
const path = require( 'path' );

const mw = require( './mocks/mw.js' );
globalThis.mw = mw;

// Minimal $ shim: returns the element wrapped in an array-like with a [0] accessor.
// ext.tabberNeue only uses it as `mw.hook(...).fire( $( panel ) )` — consumers
// of the hook may call $.fn methods, but tests for ext.tabberNeue don't exercise that.
globalThis.$ = vi.fn( ( el ) => {
	const wrapped = [ el ];
	wrapped.length = 1;
	return wrapped;
} );

// Stub OO so that any accidental require of OOJS-using files doesn't blow up.
globalThis.OO = { inheritClass: vi.fn(), ui: { Element: function noop() {} } };

const originalResolveFilename = Module._resolveFilename;
const TABBER_MODULE_DIR = path.resolve( __dirname, '../../modules/ext.tabberNeue' );

Module._resolveFilename = function ( request, parent, ...rest ) {
	if ( parent && parent.filename && parent.filename.startsWith( TABBER_MODULE_DIR ) ) {
		if ( request === './config.json' ) {
			return path.resolve( __dirname, 'mocks/config.js' );
		}
	}
	return originalResolveFilename.call( this, request, parent, ...rest );
};

// The mw.hook registry is module-scoped and persists across tests in the same
// worker. Reset between tests so a hook fired in one test doesn't replay into
// listeners registered by a later test.
afterEach( () => {
	mw._resetHooks();
} );
