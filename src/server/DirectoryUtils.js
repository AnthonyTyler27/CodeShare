/* this file gets a directory structure from the server 
in a format the front-end can deal with
*/
// directoryUtils.js

const fs = require('fs');

function getDirectoryStructure(dir) {
  const files = fs.readdirSync(dir);
  let directoryStructure = [];

  files.forEach((file) => {
    const filePath = `${dir}/${file}`;
    const fileStats = fs.statSync(filePath);
    const isDirectory = fileStats.isDirectory();

    if (isDirectory) {
      const subDirectory = {
        id: btoa(filePath),
        name: file,
        children: getDirectoryStructure(filePath),
      };
      directoryStructure.push(subDirectory);
    } else {
      const fileItem = {
        id: btoa(filePath),
        name: file,
      };
      directoryStructure.push(fileItem);
    }
  });

  // Sort the directoryStructure array (folders first, files last)
  directoryStructure.sort((a, b) => {
    if (a.children && !b.children) {
      return -1; // a is a folder, b is a file
    } else if (!a.children && b.children) {
      return 1; // a is a file, b is a folder
    } else {
      return a.name.localeCompare(b.name); // sort alphabetically if both are folders or files
    }
  });

  return directoryStructure;
}

module.exports = {
  getDirectoryStructure,
};
