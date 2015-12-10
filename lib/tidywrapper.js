/** @babel */
import stream from 'stream';
import util from 'util';
import childprocess from 'child_process';
import lodash from 'lodash';

// tidy exit codes
//var TIDY_OK = 0;
var TIDY_WARN = 1;
var TIDY_ERR = 2;

// default tidy opts
var DEFAULT_OPTS = {
  showWarnings: false,
  tidyMark: false,
  forceOutput: true,
  quiet: false
};

// choose suitable executable

function TidyWorker(tidyExec, opts) {
  stream.Stream.call(this);

  // Store a reference to the merged options for consumption by error reporting logic
  var mergedOpts = lodash.merge(opts, DEFAULT_OPTS);

  this._worker = childprocess.spawn(tidyExec, parseOpts(mergedOpts));
  var self = this;
  var errors = '';
  this._worker.stdin.on('drain', function() {
    self.emit('drain');
  });
  this._worker.stdin.on('error', function() {
    self.emit('error');
  });
  this._worker.stdout.on('data', function(data) {
    self.emit('data', data);
  });
  this._worker.stdout.on('close', function(data) {
    self.emit('close');
  });
  this._worker.stderr.on('data', function(data) {
    errors += data;
  });
  this._worker.on('exit', function(code) {
    switch (code) {
      // If there were any warnings or errors from Tiny command
      case TIDY_WARN:
        // The user asks to see warnings.
        if (mergedOpts.showWarnings) {
          self.emit('error', errors);
        }
        break;
      case TIDY_ERR:
        // The user asks to see errors.
        if (mergedOpts.showErrors) {
          self.emit('error', errors);
        }
        break;
    }
    self.emit('end');
  });
}

util.inherits(TidyWorker, stream.Stream);


TidyWorker.prototype.end = function(data) {
  if (!this._worker) {
    throw new Error('worker has been destroyed');
  }
  this._worker.stdin.end(data);
};

function tidy(tidyExec, text, opts, cb) {
  // options are optional
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  if (typeof cb !== 'function') {
    throw new Error('no callback provided for tidy');
  }
  var worker = new TidyWorker(tidyExec, opts);
  var result = '';
  var error = '';
  worker.on('data', function(data) {
    result += data;
  });
  worker.on('error', function(data) {
    error += data;
  });
  worker.on('end', function(code) {
    cb(error, result);
  });
  worker.end(text);
}

function parseOpts(opts) {
  opts = opts || {};
  var args = [];
  for (var n in opts) {
    if (n) {
      args.push('--' + toHyphens(n));
      switch (typeof opts[n]) {
        case 'string':
        case 'number':
          args.push(opts[n]);
          break;
        case 'boolean':
          args.push(opts[n] ? 'yes' : 'no');
          break;
        default:
          throw new Error('unknown option type: ' + typeof opts[n]);
      }
    }
  }
  return args;
}

function toHyphens(str) {
  return str.replace(/([A-Z])/g, function(m, w) {
    return '-' + w.toLowerCase();
  });
}

export default tidy;
