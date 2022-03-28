const fs = require('fs');
const icoMoonConfig = require('../app/containers/CustomIcon/selection.json');

const iconsName = {};
icoMoonConfig.icons.forEach((icon) => {
	icon.properties.name.split(/\s*,\s*/g).forEach((name) => {
		iconsName[name] = icon.properties.code;
	});
});

fs.writeFile('app/containers/CustomIcon/glyphIcoMoon.json', JSON.stringify(iconsName), 'utf8', function (err) {
	if (err) {
		console.log('An error occurred while writing JSON Object to File.');
		console.log(err);
		return;
	}

	console.log('JSON file has been saved.');
});
