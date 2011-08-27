var sys = require('sys'),
path = require('path'),
fs = require('fs'),
normalizer = require('./lib/normalize').Normalizer;

var testFileName = 'test_silence_4.mp3';
var testFilePath = __dirname + '/tmp/' + testFileName;
normalizer.normalizeFile(testFilePath, function(err, text) {
			   if (err) {
			     sys.puts(JSON.stringify(err));
			   } else {
			     sys.puts(text);
			     fs.unlinkSync(__dirname + '/' + path.basename(testFileName, '.mp3') + '.flac');
			   }
			 });