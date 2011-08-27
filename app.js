
/**
 * Module dependencies.
 */

var logger = require('nlogger').logger(module);
var fs = require('fs');
var express = require('express')
	, form = require('connect-form');


var app = module.exports = express.createServer(
	form({ keepExtensions: true })
);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

var tempDir = '/tmp/'; //this is where the connect middleware is storing uploaded files
var audioDir = '/home/teamates/audio/'; // this is where we will permanently store uploaded files
var fileCounter = 'counter.json';

app.get('/', function(req, res){
  res.render('index', {
    title: 'Tea-mates'
  });
});

app.post('/', function (req, res, next) {
	req.form.complete(function(err, fields, files) {
		if (err) {
			next(err);
		} else {
			logger.debug('\nuploaded %s to %s'
	    	        	, files.audio.filename
	    	        	, files.audio.path);

			// should prob use async fs functions below with a callback

			// get the file extension
			var split = files.audio.filename.split('.');
			var ext = split[split.length - 1];

			if (ext == 'mp3') {
				// get the file counter and increment it
				var fileContents = fs.readFileSync(fileCounter,'utf8');
				var jsonCounter = JSON.parse(fileContents);
				var counter = jsonCounter.counter;
				counter++;
				logger.debug(counter);
				fs.writeFileSync(fileCounter, '{ "counter": ' + counter + ' }');

				// move the file from the temp to permanent dir
				fs.rename(files.audio.path
						  , audioDir + counter + '.' + ext);
		    	res.redirect('back');
			}
			else {
				res.send(415);
			}


		}
	});

	req.form.on('progress', function(bytesReceived, bytesExpected){
		var percent = (bytesReceived / bytesExpected * 100) | 0;
		process.stdout.write('Uploading: %' + percent + '\r');
	});
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
