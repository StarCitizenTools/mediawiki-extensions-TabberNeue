module.exports = function(config) {
	config.set({
		basePath: '../../',
		frameworks: ['jasmine'],
		files: [
			'resources/lib/jquery/jquery.js',

			'extensions/Tabber/js/**/*.js',
			'extensions/Tabber/spec/**/*.js'
		],
		reporters: ['progress', 'coverage'],
		coverageReporter: {
			reporters: [
				{ type: 'text-summary' }
			]
		},
		preprocessors: {
			'extensions/Tabber/js/**/*.js': ['coverage']
		},
		port: 9876,  // karma web server port
		colors: true,
		logLevel: config.LOG_INFO,
		browsers: ['ChromeHeadless'],
		autoWatch: false,
		concurrency: Infinity
	})
};
