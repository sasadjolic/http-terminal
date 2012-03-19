// Dependencies
var exec = require('child_process').exec;
var fs = require('fs-extra');
var less = require('less');
var seq = require('seq');

// Do the build.
var build = {};
seq()
	.seq(function () {
		// Read in the project version.
		fs.readFile('VERSION', 'ascii', this);
	})
	.seq(function(version) {
		// Save the version number for later.
		build.version = '' + version;

		// Copy raw JS, if required.
		/*
		fs.copyFileSync('lib/http-terminal.js', 'dist/http-terminal-' + build.version + '.js');
		*/

		// Minify JS.
		exec('java -jar build/closure/compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js lib/http-terminal.js --js_output_file dist/http-terminal-' + build.version + '.min.js', this);

		// Alternatively, use jsmin. It doesn't compress as much as the closure compiler.
		/*
		var jsmin = require('jsmin').jsmin;
		var minified = jsmin(css, 3);
		*/
	});
