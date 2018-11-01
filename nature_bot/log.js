function pad(pad, str, padLeft) {
  if (typeof str === 'undefined') 
    return pad;
  if (padLeft) {
    return (pad + str).slice(-pad.length);
  } else {
    return (str + pad).substring(0, pad.length);
  }
}

var verbosities = ['verbose', 'info', 'warning', 'error'];
var verbosity = verbosities.indexOf(process.argv[2]);
if (verbosity < 0) verbosity = 1;
function log(message, type) {
   var level = verbosities.indexOf(type);
   if (level < 0) level = 1;

   // Now we can use log files lul
   if (level >= verbosity) {
      console.log(pad('       ', type.toUpperCase(), true) + '| ' + message);
   }
}
function log_verbose(message) { log(message, 'verbose'); }
function log_info   (message) { log(message, 'info');    }
function log_warning(message) { log(message, 'warning'); }
function log_error  (message) { log(message, 'error');   }

module.exports = log;
module.exports.verbose = log_verbose;
module.exports.info    = log_info   ;
module.exports.warning = log_warning;
module.exports.error   = log_error  ;