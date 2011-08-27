var fs = require('fs'),
util = require('util'),
sys = require('sys'),
path = require('path'),
exec  = require('child_process').exec,
_ = require('../node_modules/underscore');

var Normalizer = exports.Normalizer = (
  function() {

    /*
     * private functions and variables
     */
    function splitFile(filePath, callback) {
      var cmd = 'mp3splt -N -s -p th=-30,rm ' + filePath;
      sys.puts(__dirname + ":" + cmd);

      var fileSegmentPath = function(segmentNumber) {
	return __dirname + '/' + path.basename(filePath) + '_silence_' + segmentNumber + '.mp3';
      };

      var child = exec(cmd,
		       function (err, stdout, stderr) {
			 if (err) {
			   return callback(err, null);
			 } else {
			   sys.puts(stdout);
			   var audioFiles = [];
			   var silencePointRegexp = /^Total\ssilence\spoints\found:\s(\d+)\./;
			   var silencePointsResult = stdout.match(silencePointRegexp);
			   if (silencePointsResult) {
			     var silencePoints = silencePointsResult[1];
			     if (silencePoints > 0) {
			       audioFiles = _.map(_.range(silencePoint), function(segmentNumber) { return fileSegmentPath(segmentNumber + 1); });
			     }
			     return callback(null, audioFiles);
			   } else {
			     return callback(null, [filePath]);
			   }
			 }
		       });
    }

    function flacConversion(filePath, callback) {
      var convertedFlacFileName = path.basename(filePath, '.mp3') + '.flac';
      var convertedFlacFilePath = path.dirname(filePath) + '/'+ convertedFlacFileName;
      var cmd = 'sox ' + filePath + ' ' + convertedFlacFilePath + ' gain -n -5 silence 1 5 2%';
      sys.puts(__dirname + ":" + cmd);
      var child = exec(cmd,
		       function (err, stdout, stderr) {
			 if (err) {
			   return callback(err, null);
			 } else {
			   return callback(null, convertedFlacFilePath);
			 }
		       });
    }

    function apiCall(flacFileName, callback) {
      var cmd = "curl --data-binary @" + flacFileName + " --header 'Content-type: audio/x-flac; rate=16000' 'https://www.google.com/speech-api/v1/recognize?xjerr=1&client=chromium&pfilter=2&lang=en-US&maxresults=6'";
      sys.puts(cmd);
      var child = exec(cmd,
		       function (err, stdout, stderr) {
			 if (err) {
			   return callback(err);
			 } else {
			   sys.puts(stdout);
			   var apiResult = JSON.parse(stdout);
			   return callback(null, apiResult.hypotheses[0].utterance);
			 }
		       });
    }

    function convertToText(audioFiles, speechText, callback) {
      var firstAudioFile = _.head(audioFiles);
      var restOfAudioFiles = _.tail(audioFiles);

      if (firstAudioFile) {
	flacConversion(firstAudioFile, function(err, flacFileName) {
			 if (err) {
			   callback(err, speechText);
			 } else {
			   apiCall(flacFileName, function(err, text) {
				     if (err) {
				       callback(err, speechText);
				     } else {
				       speechText = speechText + text;
				       convertToText(restOfAudioFiles, speechText, callback);
				     }
				   });
			 }
		       });
      } else {
	callback(null, speechText);
      }
    }

    /*
     * public functions and variables
     */
    return {
      normalizeFile: function(filePath, callback) {
	var self = this;
	splitFile(filePath, function(err, splittedFiles) {
		    if (err) {
		      return callback(err, null);
		    } else {
		      return convertToText(splittedFiles, "", callback);
		    }
		  });
      }
    };

  })();


