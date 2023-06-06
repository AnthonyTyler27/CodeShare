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

  return directoryStructure;
}

module.exports = {
  getDirectoryStructure,
};