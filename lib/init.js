'use babel';

import tidywrapper from './tidywrapper';
import path from 'path';
import fs from 'fs';
import lodash from 'lodash';


export default {
  config: {
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
      type: 'string'
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
  },
  activate() {
    atom.workspace.observeTextEditors(editor => {
      editor.getBuffer().onWillSave(() => {
        if (saveFormattedHtml) {
          return;
        }
        if (!atom.config.get('atom-htmltidy.formatOnSave')) {
          return;
        }
        const isSupported = editor.getGrammar().scopeName.indexOf('text.html') !== -1;
        if (isSupported) {
          format(editor, false, true);
        }

      });
    });

    atom.commands.add('atom-workspace', 'atom-htmltidy:format', () => {
      format(atom.workspace.getActiveTextEditor(), true, false);
    });
  },
};


/**
 * format content of editor
 *
 * @param editor the current editor
 * @param forceFormat force format of html file
 * @param saveAfterFormat execute an editor save after formatting
 */
function format(editor, forceFormat, saveAfterFormat) {
  var text = editor.getText();
  if (text) {
    if (userSavedUndo(text) || forceFormat) {
      var options = getOptions(editor) || {};
      setDynamicOptions(text, options);
      var tidyExec = fileNameOfTidyHtml5Executable();
      if (tidyExec) {
        tidywrapper(tidyExec, text, options, (err, result) => OnFormatFinished(err, result, text, editor, saveAfterFormat));
      }
    }
  }
}

var prevTextForUndoHandling = null;
/**
 * check if user save undo to prevent re formatting of reverted text
 *
 * @param text current content
 * @returns true, if user did revert text
 */
function userSavedUndo(text) {
  if (text !== prevTextForUndoHandling) {
    prevTextForUndoHandling = text;
    return true;
  }
  return false;
}

/**
 * process the finished formatting
 *
 * @param err tidy html 5 err during formatting
 * @param formattedText the formatted text
 * @param text the unformatted text
 * @param editor the editor with this content
 * @param saveAfterFormat execute an editor save after formatting
 */
function OnFormatFinished(err, formattedText, text, editor, saveAfterFormat) {
  if (err) {
    handleError(err);
  } else {
    setText(editor, formattedText);
    if (atom.config.get('atom-htmltidy.secureTagCount')) {
      let oldTagCount = text.split('<').length;
      let newTagCount = formattedText.split("<").length;
      if (oldTagCount !== newTagCount) {
        var message = (oldTagCount - newTagCount) + ' tags missing.';
        if (oldTagCount < newTagCount) {
          message = (newTagCount - oldTagCount) + ' tags added.';
        }
        atom.notifications.addWarning('atom-htmltidy: tag count changed', {
          detail: message
        });
      }
    }
    if (saveAfterFormat) {
      save(editor);
    }
  }
}

/**
 * get tidy html 5 options from file or setting
 *
 * @param editor current editor
 * @returns tidy html 5 options
 */
function getOptions(editor) {
  try {
    var result;
    if (atom.config.get('atom-htmltidy.fileSearchEnabled')) {
      var path = editor.getPath();
      var file = findFile(path, atom.config.get('atom-htmltidy.fileSearchFilename'));
      if (file) {
        result = fs.readFileSync(file, 'utf8');
      }
    }
    if (!result) {
      result = atom.config.get('atom-htmltidy.optionsTidy');
    }
    if (result) {
      return JSON.parse(result);
    }
  } catch (err) {
    atom.notifications.addWarning(`atom-htmltidy: JSON is not valid.`, {
      detail: err.message
    });
  }
  return null;
}
/**
 * find tidy html 5 options
 *
 * @param directory current directory
 * @param name filename to search for
 * @returns filename
 */
function findFile(directory, name) {
  const chunks = directory.split(path.sep);

  while (chunks.length) {
    let currentDir = chunks.join(path.sep);
    if (currentDir === '') {
      currentDir = path.resolve(directory, '/');
    }

    const filePath = path.join(currentDir, name);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    chunks.pop();
  }

  return null;
}
/**
 * set dynamic options if settings are active
 *
 * @param text current text
 * @param options tidy html 5 options
 */
function setDynamicOptions(text, options) {
  if (atom.config.get('atom-htmltidy.enableDynamicTags')) {
    addTagsToNewBlockLevel(text, options);
  }

  if (atom.config.get('atom-htmltidy.enableDynamicBody')) {
    addShowBodyOnly(text, options);
  }
}

/**
 * add tags with - to tidy html 5 new block level tags
 *
 * @param text current text
 * @param options tidy html 5 options
 */
function addTagsToNewBlockLevel(text, options) {
  var elements = text.split('<');

  var blockLevelTags = lodash(elements)
    .map((obj) => obj.trim().split(' ')[0])
    .filter((obj) => !obj.startsWith('/') && !obj.startsWith('!'))
    .filter((obj) => obj.indexOf('-') > 0)
    .uniq()
    .join();
  var existingBlockLevelTags = options['new-blocklevel-tags'];
  if (existingBlockLevelTags) {
    blockLevelTags = existingBlockLevelTags + ' ' + blockLevelTags;
  }
  options['new-blocklevel-tags'] = blockLevelTags;
}

/**
 * add show-body-only if <body> exists
 *
 * @param text current text
 * @param options tidy html 5 options
 */
function addShowBodyOnly(text, options) {
  options['show-body-only'] = text.indexOf("<body>") < 0;
}

/**
 * handle tidy html 5 error
 *
 * @param err exception
 */
function handleError(err) {
  console.log(err);
  atom.notifications.addError('atom-htmltidy', {
    detail: err.message
  });
}

/**
 * set new content in editor
 *
 * @param editor active editor
 * @param text text to set in editor
 */
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


var saveFormattedHtml = false;
/**
 * save changes in editor
 *
 * @param editor the active editor
 */
function save(editor) {
  saveFormattedHtml = true;
  editor.save();
  saveFormattedHtml = false;
}

/**
 * filename of the tidy html 5 executable
 *
 * @returns filename
 */
function fileNameOfTidyHtml5Executable() {
  var tidyExec = atom.config.get('atom-htmltidy.tidyExecPath');
  if (tidyExec) {
    if (fs.existsSync(tidyExec)) {
      return tidyExec;
    } else {
      atom.notifications.addWarning('atom-htmltidy', {
        detail: `configured tidy executable is missing. Fallback to default`
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
        detail: `Unsupported platform ${process.platform}. Please configure own tidy executable`
      });
      tidyExec = null;
  }
  if (tidyExec) {
    tidyExec = path.join(__dirname, 'bin', tidyExec);
  }
  return tidyExec;
}
