const fs = require('fs');
const path = require('path');

const translationsPath = './app/i18n/locales';

// Read the files in the folder
fs.readdir(translationsPath, (err, files) => {
    if (err) {
        console.error("Error listing folder files:", err);
        return;
    }

    files.forEach(file => {
        // Check if the file is a .json
        if (path.extname(file) === '.json') {
            const filePath = path.join(translationsPath, file);

            // Read the file content
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading file ${file}:`, err);
                    return;
                }

                // Parse the content into an object
                const obj = JSON.parse(data);

                // Sort the object keys alphabetically
                const sortedObj = Object.keys(obj).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).reduce((acc, key) => {
                    acc[key] = obj[key];
                    return acc;
                }, {});

                // Convert the object back to JSON
                const sortedJSON = JSON.stringify(sortedObj, null, 2);

                // Overwrite the file with the sorted JSON
                fs.writeFile(filePath, sortedJSON, 'utf8', (err) => {
                    if (err) {
                        console.error(`Error writing to file ${file}:`, err);
                        return;
                    }

                    console.log(`${file} was successfully updated.`);
                });
            });
        }
    });
});
