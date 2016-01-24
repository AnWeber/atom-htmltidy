/** @babel */
import stream from 'stream';
import childprocess from 'child_process';
import lodash from 'lodash';

//const EXIT_CODE_OK = 0;
const EXIT_CODE_WARNING = 1;
const EXIT_CODE_ERROR = 2;

export default class TidyWorker extends stream.Stream {
  constructor(tidyExec, options) {
    super();
    stream.Stream.call(this);
    this.tidyExec = tidyExec;
    this.options = lodash.merge(options, {
      showWarnings: false,
      tidyMark: false,
      forceOutput: true,
      quiet: false
    });
  }

  parseOptions(opts) {
    opts = opts || {};
    var args = [];

    const toHyphens = (str) => {
      return str.replace(/([A-Z])/g, function(m, w) {
        return '-' + w.toLowerCase();
      });
    };
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

  formatAsync(text) {
    const self = this;
    return new Promise((resolve, reject) => {
      const worker = childprocess.spawn(this.tidyExec, this.parseOptions(this.options));
      let formattedText = '';
      let error = '';
      worker.stdout.on('data', function(data) {
        formattedText += data;
      });
      worker.stderr.on('data', function(data) {
        error += data;
      });
      worker.on('exit', function(code) {
        if (code === EXIT_CODE_ERROR && self.options.showErrors) {
          reject(error);
        } else if (code === EXIT_CODE_WARNING && self.options.showWarnings) {
          reject(error);
        } else {
          resolve(formattedText);
        }
      });
      worker.stdin.end(text);
    });
  }
}
