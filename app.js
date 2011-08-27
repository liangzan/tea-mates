
/**
 * Module dependencies.
 */

var logger = require('nlogger').logger(module);

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

app.get('/', function(req, res){
//  res.render('index', {
//    title: 'Express'
//  });
	res.send('<form method="post" enctype="multipart/form-data" '
			 + '<p>Audio file: <input type="file" name="audio" /></p>'
			 + '<p><input type="submit" value="Upload" /></p>'
			 + '</form>');
});

app.post('/', function (req, res, next) {
	req.form.complete(function(err, fields, files) {
		if (err) {
			next(err);
		} else {
//			logger.debug(fields);
			// if there was a image uploaded, move it from tmp to our image folder
			logger.debug('\nuploaded %s to %s'
	    	        	, files.audio.filename
	    	        	, files.audio.path);
			fs.rename(files.audio.path
					  , audioDir + files.audio.filename);
	    	res.redirect('back');
		}
	});
	
	req.form.on('progress', function(bytesReceived, bytesExpected){
		var percent = (bytesReceived / bytesExpected * 100) | 0;
		process.stdout.write('Uploading: %' + percent + '\r');
	});
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
