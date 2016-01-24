'use babel';

import { CompositeDisposable } from 'atom';
import configJson from './config.json';
import lodash from 'lodash';
import EditorHandler from './editorHandler';
import fs from 'fs';

/**
 * extensions for formattiong html content
 */
class HtmlTidy {
  constructor() {
    this.config = configJson;
  }
  /**
   * activate extensions
   */
  activate() {
    this.disposables = new CompositeDisposable();
    this.disposables.add(
      atom.config.observe('atom-htmltidy', (value) => {
        this.isValid = false;
        this.settings = value;
        this.settings.tidyExec = this._fileNameOfTidyExecutable();

        if (this.settings.tidyExec) {
          this.isValid = true;
        }
        this._observeTextEditors();
      })
    );

    this.disposables.add(
      atom.commands.add('atom-workspace', 'atom-htmltidy:format', () => {
        if (this.isValid) {
          const textEditor = atom.workspace.getActiveTextEditor();
          if (textEditor) {
            const editorHandler = this._watchTextEditor(textEditor);
            if (editorHandler) {
              editorHandler.format(false);
            } else {
              atom.notifications.addWarning('atom-htmltidy', {
                detail: `grammar ${textEditor.getGrammar().scopeName} is not supported`
              });
            }
          }
        }
      })
    );

    this.disposables.add(
      atom.commands.add('atom-workspace', 'atom-htmltidy:toggleAutoSave', () => {
        atom.config.set('atom-htmltidy.formatOnSave', !this.settings.formatOnSave);
      })
    );
  }

  deactivate() {
    this._dispose();
    this.disposables.dispose();
  }

  /**
   * attach EditorHandler for open TextEditor
   */
  _observeTextEditors() {
    if (this.settings.formatOnSave && this.isValid) {
      if (!this.observeDisposable) {
        lodash.forEach(atom.workspace.getTextEditors(), (textEditor) => {
          this._watchTextEditor(textEditor);
        });
        this.observeDisposable = atom.workspace.observeTextEditors(textEditor => {
          this._watchTextEditor(textEditor);
        });
      }
      if (this.editorHandlers) {
        lodash.forEach(this.editorHandlers, (handler) => handler.refresh(this.settings));
      }
    } else {
      this._dispose();
    }
  }
  /**
   * dispose all observers
   */
  _dispose() {
    if (this.editorHandlers) {
      lodash.forEach(this.editorHandlers, (handler) => handler.dispose());
      this.editorHandlers = null;
    }
    if (this.observeDisposable) {
      this.observeDisposable.dispose();
      this.observeDisposable = null;
    }
  }
  /**
   * attach handler for texteditor
   * @param  {TextEditor} textEditor current texteditor
   * @return {EditorHandler}         der erzeugte Handler
   */
  _watchTextEditor(textEditor) {
    const isSupported = textEditor.getGrammar().scopeName.indexOf('text.html') !== -1;
    if (isSupported) {
      if (!this.editorHandlers) {
        this.editorHandlers = {};
      }
      const contentPath = textEditor.getPath();
      let editorHandler = this.editorHandlers[contentPath];
      if (!editorHandler) {
        editorHandler = new EditorHandler(textEditor,
          this.settings,
          () => {
            this.editorHandlers[contentPath] = null;
            delete this.editorHandlers[contentPath];
          });

        this.editorHandlers[contentPath] = editorHandler;
      }
      return editorHandler;
    }
  }

  /**
   * filename of the tidy html 5 executable
   *
   * @returns filename
   */
  _fileNameOfTidyExecutable() {
    var tidyExec = this.settings.tidyExecPath;
    if (tidyExec) {
      if (fs.existsSync(tidyExec)) {
        return tidyExec;
      } else {
        atom.notifications.addWarning('atom-htmltidy', {
          detail: `configured tidy executable is missing. Fallback to default`
        });
      }

    }
    tidyExec = `${__dirname}/bin/${process.platform}/tidy`;
    if (process.platform === 'win32') {
      tidyExec += '.exe';
    }
    if (fs.existsSync(tidyExec)) {
      return tidyExec;
    }
    atom.notifications.addWarning('atom-htmltidy', {
      detail: `Unsupported platform ${process.platform}. Please configure own tidy executable.`
    });
    return null;
  }
}

export default new HtmlTidy();
