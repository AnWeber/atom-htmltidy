/** @babel */
import tidywrapper from './tidywrapper';
import path from 'path';
import fs from 'fs';
import lodash from 'lodash';

var pathInterop = _interopRequireDefault(path);
var fsInterop = _interopRequireDefault(fs);


var saveTidyHtml = false;
var prevText = null;

export const config = {
  enableDynamicTags: {
    title: 'dynamic new-blocklevel-tags',
    description: 'all tags with "-" separator will be added to new-blocklevel-tags. e.g angular bootstrap: uib-alert',
    type: 'boolean',
    default: false
  },
  enableDynamicBody: {
    title: 'dynamic show-body-only',
    description: 'set show-body-only true if no body tag exists',
    type: 'boolean',
    default: false
  },
  formatOnSave: {
    title: 'format on save',
    description: 'format html document on save',
    type: 'boolean',
    default: true
  },
  fileSearchEnabled: {
    title: 'enable file search',
    description: 'enable search for tidy html 5 options file',
    type: 'boolean',
    default: true
  },
  fileSearchFilename: {
    title: 'filename of tidy html 5 options',
    description: 'filename of tidy html 5 options',
    type: 'string',
    default: '.htmltidy'
  },
  optionsTidy: {
    title: 'default options',
    description: 'default options for Tidy HTML 5',
    type: 'string',
    default: '{}'
  },
  secureTagCount: {
    title: 'warn on tag count change',
    description: 'show warning if tag count is changed',
    type: 'boolean',
    default: false
  },
  tidyExecPath: {
    title: 'path to tidy executable',
    description: 'path to external tidy executable',
    type: 'string',
    default: ''
  },
};

export const activate = () => {
  atom.workspace.observeTextEditors(editor => {
    editor.getBuffer().onWillSave(() => {
      if (saveTidyHtml) {
        return;
      }
      if (!atom.config.get('atom-htmltidy.formatOnSave')) {
        return;
      }
      const isSupported = editor.getGrammar().scopeName.indexOf('text.html') !== -1;
      if (isSupported) {
        format(editor);
      }

    });
  });

  atom.commands.add('atom-workspace', 'atom-htmltidy:format', () => {
    format(atom.workspace.getActiveTextEditor(), true);
  });
};


function format(editor, forceFormat) {
  var text = editor.getText();
  if (text) {
    if (userSavedUndo(text) || forceFormat) {
      var options = getOptions(editor);
      if (options) {
        setDynamicOptions(text, options);
        var tidyExec = getTidyExec();
        tidywrapper(tidyExec, text, options, (err, result) => OnFormatFinished(err, result, text, editor));
      } else {
        atom.notifications.addInfo('atom-htmltidy', {
          detail: 'please configure options',
        });
      }
    }
  }
}

function userSavedUndo(text) {
  if (text !== prevText) {
    prevText = text;
    return true;
  }
  return false;
}

function OnFormatFinished(err, resultText, text, editor) {
  if (err) {
    handleError(err);
  } else {
    setText(editor, resultText);
    if (atom.config.get('atom-htmltidy.secureTagCount')) {
      let oldTagCount = text.split('<').length;
      let newTagCount = resultText.split("<").length;
      if (oldTagCount !== newTagCount) {
        var message = (oldTagCount - newTagCount) + ' tags missing.';
        if (oldTagCount < newTagCount) {
          message = (newTagCount - oldTagCount) + ' tags added.'
        }
        atom.notifications.addWarning('atom-htmltidy: tag count changed', {
          detail: message
        });
      }
    }
    save(editor);
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

function setDynamicOptions(text, options) {
  if (atom.config.get('atom-htmltidy.enableDynamicTags')) {
    addTagsToNewBlockLevel(text, options);
  }

  if (atom.config.get('atom-htmltidy.enableDynamicBody')) {
    addShowBodyOnly(text, options);
  }
}

function addTagsToNewBlockLevel(text, options) {
  var elements = text.split('<');

  var blockLevelTags = lodash(elements)
    .map((obj) => obj.trim().split(' ')[0])
    .filter((obj) => !obj.startsWith('/') && !obj.startsWith('!'))
    .filter((obj) => obj.indexOf('-') > 0)
    .uniq()
    .join();
  options['new-blocklevel-tags'] = blockLevelTags;
}

function addShowBodyOnly(text, options) {
  options['show-body-only'] = text.indexOf("<body>") < 0;
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

  editor.setCursorBufferPosition(cursorPosition);

  if (editor.getScreenLineCount() > line) {
    editor.scrollToScreenPosition([line, 0]);
  }
}

function save(editor) {
  saveTidyHtml = true;
  editor.save();
  saveTidyHtml = false;
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
