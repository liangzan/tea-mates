/*
 * Module dependencies.
 */
require('nko')('qZEbdQsd5oI2kFe0');

var logger = require('nlogger').logger(module),
sys = require('sys'),
path = require('path'),
fs = require('fs'),
exec  = require('child_process').exec,
express = require('express'),
form = require('connect-form'),
normalizer = require('./lib/normalize').Normalizer;

var app = module.exports = express.createServer(
  form({ keepExtensions: true })
), io = require('socket.io').listen(app);

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
var audioDir = __dirname + '/audio/';
var fileCounter = __dirname + '/counter.json';

app.get('/', function(req, res){
	  res.render('index', {result: ""});
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
logger.debug("counter:" + counter)
				   logger.debug(counter);
				   fs.writeFileSync(fileCounter, '{ "counter": ' + counter + ' }');

				   // move the file from the temp to permanent dir
				   var audioFileName = counter + '.' + ext;
				   var audioFilePath = audioDir + audioFileName;
				   var cmd = "mv " + files.audio.path + " " + audioFilePath;
logger.debug("cmd:" + cmd)

				   var child = exec(cmd, function(err, stdout, stderr) {
						      if (err) {
							sys.puts(JSON.stringify(err));
						      } else {
							normalizer.normalizeFile(audioFilePath, function(err, text) {
										   if (err) {
										     sys.puts(JSON.stringify(err));
										   } else {
										     sys.puts(text);
										     res.render('index', { result: text });
										     fs.unlinkSync(__dirname + '/audio/' + path.basename(audioFileName, '.mp3') + '.flac');
										   }
										 });
						      }
						    });
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

app.listen(process.env.NODE_ENV === 'production' ? 80 : 8000, function() {

  // if run as root, downgrade to the owner of this file
//  if (process.getuid() === 0)
//   require('fs').stat(__filename, function(err, stats) {
//      if (err) return console.log(err)
//      process.setuid(stats.uid);
//    });
});
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
