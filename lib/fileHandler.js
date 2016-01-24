import path from 'path';
import fs from 'fs';

export default class FileHandler {
  /**
   * find file and read contents
   *
   * @param directory current directory
   * @param name filename to search for
   * @returns filename
   */
  static readFile(directory, name) {
    const chunks = directory.split(path.sep);

    while (chunks.length) {
      let currentDir = chunks.join(path.sep);
      if (currentDir === '') {
        currentDir = path.resolve(directory, '/');
      }

      const filePath = path.join(currentDir, name);
      if (fs.existsSync(filePath)) {
        fs.readFileSync(filePath, 'utf8');
      }
      chunks.pop();
    }

    return null;
  }

  static exists(path) {
    return path && fs.existsSync(path);
  }
}
