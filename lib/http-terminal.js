(function (global, undefined) {

	function getHTTPObject() {
		if (typeof XMLHttpRequest != 'undefined') {
			return new XMLHttpRequest();
		}
		try {
			return new ActiveXObject("Msxml2.XMLHTTP");
		}
		catch (e) {
			try {
				return new ActiveXObject("Microsoft.XMLHTTP");
			}
			catch (e) {}
		}
		return false;
	}

	if (typeof window === 'undefined') window = {};
	if (typeof localStorage === 'undefined') localStorage = {};

	window.headers = localStorage.headers ? JSON.parse(localStorage.headers) : {};
	window.pretty = localStorage.pretty;

	var version = '1.0.0';

	var welcomeMessage = 'http-terminal v' + version + '<br>';
	welcomeMessage += "Welcome, enter 'help' if you're lost.<br>";
	welcomeMessage += 'Pretty printing is ' + (window.pretty ? 'ON' : 'OFF') + '<br>';
	for (var header in window.headers) welcomeMessage += header + ': ' + window.headers[header] + '<br>';
	welcomeMessage += '<br>';

	var options = {
		welcome: welcomeMessage,
		prompt: localStorage.prompt,
		separator: '&gt;'
	}

	var cmdsBasic = {
		execute: function(cmd, args) {
			switch (cmd) {
				case 'clear':
					terminal.clear();
					return '';

				case 'help':
					return 'Commands: .., .headers, .json, .pretty, clear, delete, get, head, help, options, patch, put, post, ver, version<br>' +
						'More help <a class="external" href="http://github.com/SDA/http-terminal" target="_blank">here</a>';

				case 'version':
				case 'ver':
					return version;

				default:
					return false;
			};
		}
	}

	var cmdsHTTP = {
		commands: [],
		execute: function(cmd, args) {
			cmdlc = cmd.toLowerCase();

			if (cmd == '..') {
				// Go up one folder.
				var prompt = terminal.getPrompt();
				if (prompt.match(/http(s)?:\/\/[^\/]+(\/[^\/]+)+\/?/)) {
					prompt = prompt.replace(/\/[^\/]+$/, '');
					terminal.setPrompt(prompt);
					localStorage.prompt = prompt;
				}
				return '';
			}
			else if (cmdlc == '.headers') {
				var response = '';
				for (var header in window.headers) {
					var value = window.headers[header];
					response += header + ': ' + value + '<br>';
				}
				return response;
			}
			else if (cmdlc == '.json') {
				window.headers['Accept'] = 'application/json';
				window.headers['Content-Type'] = 'application/json';
				localStorage.headers = JSON.stringify(window.headers);
				return '';
			}
			else if (cmdlc == '.pretty') {
				if ((args.length == 0) || (args[0] && args[0].toLowerCase().match(/^true|on|yes$/))) {
					window.pretty = true;
				}
				else {
					window.pretty = false;
				}
				localStorage.pretty = window.pretty;
				return 'Pretty printing is ' + (window.pretty ? 'ON' : 'OFF');
			}
			else if (cmd.match(/^(\/[^\/]+)+$/)) {
				// Append path to the prompt.
				var prompt = terminal.getPrompt() + cmd;
				terminal.setPrompt(prompt);
				localStorage.prompt = prompt;
				return '';
			}
			else if (cmd.match(/^http(s)?:\/\/[^\/]+.*$/)) {
				// Replace prompt with the path.
				var prompt = cmd;
				terminal.setPrompt(prompt);
				localStorage.prompt = prompt;
				return '';
			}
			else if (cmd.match(/^[^:\s]+:(.*)$/)) {
				// Set header.
				var matches = cmd.match(/^([^:\s]+):(.*)$/)
				var header = matches[1];
				var value = matches[2] || args.join(' ');
				if (value) {
					// Set or update the header.
					window.headers[header] = value;
				}
				else {
					// Remove the header.
					delete window.headers[header];
				}
				localStorage.headers = JSON.stringify(window.headers);
				return '';
			}
			else if (cmdlc.match(/^post|get|put|delete|patch|head|options$/)) {
				// Perform an HTTP(S) call.
				var url = terminal.getPrompt();
				var method = cmd.toUpperCase();
				var data = args.join(' ');
				var response = '';
				try {
					var http = getHTTPObject();
					http.open(method, url, false);
					for (var header in window.headers) {
						var value = window.headers[header];
						http.setRequestHeader(header, value);
					}
					http.send(data);
					response += http.status + ' ' + http.statusText + '<br>';
					var headers = http.getAllResponseHeaders().trim();
					if (headers) response += http.getAllResponseHeaders() + '<br>';
					response += '<br>';
					var contentType = http.getResponseHeader('content-type')
					if (window.pretty && contentType && contentType.match(/json/)) {
						var obj = JSON.parse(http.responseText);
						var str = '<pre>' + JSON.stringify(obj, undefined, 2) + '</pre>';
						response += str;
					}
					else {
						response += http.responseText;
					}
				}
				catch(e) {
					response = e;
				}
				return response;
			}

			// Unknown command.
			return false;
		}
	}

	var HTTPTerminal = HTTPTerminal || function(containerID) {

		var terminal = new Terminal(containerID, options, cmdsBasic, cmdsHTTP);

		return {
			clear: function() { return terminal.clear() },
			setPrompt: function(prompt) { return terminal.setPrompt(prompt); },
			getPrompt: function() { return terminal.getPrompt(); },
			setTheme: function(theme) { return terminal.setTheme(theme); },
			getTheme: function() { return terminal.getTheme(); }
		}
	};

	// node.js
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = HTTPTerminal;

	// web browsers
	} else {
		var oldHTTPTerminal = global.HTTPTerminal;
		HTTPTerminal.noConflict = function () {
			global.HTTPTerminal = oldHTTPTerminal;
			return HTTPTerminal;
		};
		global.HTTPTerminal = HTTPTerminal;
	}

})(this);
