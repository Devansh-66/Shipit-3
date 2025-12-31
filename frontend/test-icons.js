const { getIcon } = require('material-file-icons');

console.log('Testing file: app.tsx');
console.log(JSON.stringify(getIcon('app.tsx')).substring(0, 50) + '...');

console.log('Testing folder: src');
// It doesn't seem to have a specific isFolder param in getIcon based on usage so far.
// Let's see if passing a folder-like name works or if there's another hidden export.
console.log(JSON.stringify(getIcon('src')).substring(0, 50) + '...');

try {
    const allExports = require('material-file-icons');
    console.log('Exports:', Object.keys(allExports));
} catch (e) {
    console.log('Error requiring package:', e.message);
}
