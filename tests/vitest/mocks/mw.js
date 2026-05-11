/**
 * Shared mock for MediaWiki's `mw` global object.
 *
 * Provides stubs for the mw APIs used by ext.tabberNeue runtime modules.
 * Tests can override individual methods via vi.spyOn() or by assigning directly.
 *
 * The hook registry is module-scoped and persists across tests in the same
 * worker. Call mw._resetHooks() to clear it — setup.js wires this into a
 * global afterEach so tests don't leak listeners or replay state to each other.
 */

const hookRegistry = {};

function hookFactory( name ) {
	if ( !hookRegistry[ name ] ) {
		const listeners = [];
		let lastArgs = null;
		hookRegistry[ name ] = {
			add: vi.fn( ( fn ) => {
				listeners.push( fn );
				if ( lastArgs !== null ) {
					fn( ...lastArgs );
				}
			} ),
			fire: vi.fn( ( ...args ) => {
				lastArgs = args;
				listeners.forEach( ( fn ) => fn( ...args ) );
			} ),
			remove: vi.fn( ( fn ) => {
				const idx = listeners.indexOf( fn );
				if ( idx !== -1 ) {
					listeners.splice( idx, 1 );
				}
			} ),
			_reset() {
				listeners.length = 0;
				lastArgs = null;
				hookRegistry[ name ].add.mockClear();
				hookRegistry[ name ].fire.mockClear();
				hookRegistry[ name ].remove.mockClear();
			}
		};
	}
	return hookRegistry[ name ];
}

const mw = {
	config: {
		get: vi.fn( () => null )
	},
	util: {
		debounce: vi.fn( ( fn ) => fn ),
		throttle: vi.fn( ( fn ) => fn ),
		percentDecodeFragment: vi.fn( ( s ) => decodeURIComponent( s ) ),
		messageBox: vi.fn( ( html ) => {
			const el = document.createElement( 'div' );
			el.className = 'cdx-message cdx-message--error';
			el.innerHTML = html;
			return el;
		} )
	},
	loader: {
		load: vi.fn(),
		using: vi.fn( () => Promise.resolve() )
	},
	hook: vi.fn( hookFactory ),
	html: {
		escape: vi.fn( ( s ) => String( s ) )
	},
	log: {
		error: vi.fn(),
		warn: vi.fn()
	},
	Api: vi.fn( function MwApiMock() {
		this.get = vi.fn( () => Promise.resolve( {} ) );
	} ),
	_resetHooks() {
		for ( const name of Object.keys( hookRegistry ) ) {
			hookRegistry[ name ]._reset();
			delete hookRegistry[ name ];
		}
	}
};

module.exports = mw;
