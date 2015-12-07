/** @babel */
import tidywrapper from './tidywrapper';
import path from 'path';
import fs from 'fs';

var pathInterop = _interopRequireDefault(path);
var fsInterop = _interopRequireDefault(fs);


var saveTidyHtml = false;

export const config = {
  formatOnSave: {
    title: 'Auto Format',
    description: 'Format HTML Document on Save',
    type: 'boolean',
    default: true
  },
  fileSearchEnabled: {
    title: 'enable file search',
    description: 'search file options',
    type: 'boolean',
    default: true
  },
  fileSearchFilename: {
    title: 'filename for File Search',
    description: 'Filename for HTML tidy options file',
    type: 'string',
    default: '.htmltidy'
  },
  optionsTidy: {
    title: 'Options',
    description: 'Options for Tidy HTML 5',
    type: 'string',
    default: '{}'
  },
  tidyExecPath: {
    title: 'Path to Tidy Exec',
    description: 'Exec for external Tidy Exec',
    type: 'string',
    default: ''
  },
};

export const activate = () => {
  atom.workspace.observeTextEditors(editor => {
    editor.getBuffer().onWillSave(() => {
      if (!saveTidyHtml && atom.config.get('atom-htmltidy.formatOnSave')) {
        const isSupported = editor.getGrammar().scopeName.indexOf('text.html') !== -1;
        if (isSupported) {
          format(editor);
        }
      }
    });
  });

  atom.commands.add('atom-workspace', 'atom-htmltidy:format', () => {
    format(atom.workspace.getActiveTextEditor());
  });
};


function format(editor) {
  var text = editor.getText();
  try {
    if (text) {
      var options = getOptions(editor);
      if (options) {
        var tidyExec = getTidyExec();
        tidywrapper(tidyExec, text, options, function(err, html) {
          if (err) {
            handleError(err);
          } else {
            setText(editor, html);
          }
        });
      } else {
        atom.notifications.addInfo('atom-htmltidy', {
          detail: 'No Options, No Cry.'
        });
      }
    }
  } catch (err) {
    handleError(err);
    return;
  }
}

function getOptions(editor) {

  try {
    var result;
    if (atom.config.get('atom-htmltidy.fileSearchEnabled')) {
      var path = editor.getPath();
      var file = findFile(path, atom.config.get('atom-htmltidy.fileSearchFilename'));
      if (file) {
        result = fsInterop.default.readFileSync(file, 'utf8');
      }
    }
    if (!result) {
      result = atom.config.get('atom-htmltidy.optionsTidy');
    }
    if (result) {
      return JSON.parse(result);
    }
  } catch (err) {
    atom.notifications.addWarning('atom-htmltidy: JSON is not valid.', {
      detail: err.message
    });
  }
  return null;
}

function handleError(err) {
  console.log(err);
  atom.notifications.addError('atom-htmltidy', {
    detail: err.message
  });
}


function setText(editor, text) {
  const editorEl = atom.views.getView(editor);
  const cursorPosition = editor.getCursorBufferPosition();
  const line = editorEl.getFirstVisibleScreenRow() + editor.displayBuffer.getVerticalScrollMargin();

  editor.setText(text);
  saveTidyHtml = true;
  editor.save();
  saveTidyHtml = false;

  editor.setCursorBufferPosition(cursorPosition);

  if (editor.getScreenLineCount() > line) {
    editor.scrollToScreenPosition([line, 0]);
  }
}

function findFile(directory, name) {
  const chunks = directory.split(pathInterop.default.sep);

  while (chunks.length) {
    let currentDir = chunks.join(pathInterop.default.sep);
    if (currentDir === '') {
      currentDir = path.default.resolve(directory, '/');
    }

    const filePath = pathInterop.default.join(currentDir, name);
    if (fsInterop.default.existsSync(filePath)) {
      return filePath;
    }
    chunks.pop();
  }

  return null;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}


function getTidyExec() {
  var tidyExec = atom.config.get('atom-htmltidy.tidyExecPath');
  if (tidyExec) {
    if (fsInterop.default.existsSync(tidyExec)) {
      return tidyExec;
    } else {
      atom.notifications.addWarning('atom-htmltidy', {
        detail: 'Configured Tidy Exec missing. Fallback to default.'
      });
    }
  }
  switch (process.platform) {
    case 'win32':
      tidyExec = path.join('win32', 'tidy.exe');
      break;
    case 'linux':
      tidyExec = path.join('linux', 'tidy');
      break;
    case 'darwin':
      tidyExec = path.join('darwin', 'tidy');
      break;
    default:
      atom.notifications.addWarning('atom-htmltidy', {
        detail: 'Unsupported platform. Please configure own tidy executable'
      });
  }
  return path.join(__dirname, 'bin', tidyExec);
}
