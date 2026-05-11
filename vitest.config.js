import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		environment: 'jsdom',
		include: [ 'tests/vitest/**/*.test.js' ],
		globals: true,
		passWithNoTests: true,
		setupFiles: [ 'tests/vitest/setup.js' ],
		testTimeout: 10000,
		hookTimeout: 15000,
		coverage: {
			provider: 'v8',
			reportsDirectory: 'coverage/js',
			reporter: [ 'lcov', 'text' ],
			include: [ 'modules/ext.tabberNeue/**/*.js' ]
		}
	}
} );
