const fs = require('fs');
const icoMoonConfig = require('../app/containers/CustomIcon/selection.json');

let iconsName = 'export const mappedIcons = {\n';
icoMoonConfig.icons.forEach((icon) => {
	icon.properties.name.split(/\s*,\s*/g).forEach((name) => {
		iconsName += `\t'${name}': ${icon.properties.code},\n`;
	});
});
iconsName = `${iconsName.slice(0, -2) }\n};\n`;

fs.writeFile('app/containers/CustomIcon/mappedIcons.js', iconsName, 'utf8', function (err) {
	if (err) {
		console.log('An error occurred while writing Object to File.');
		console.log(err);
		return;
	}

	console.log('🚀   Icons name generated.');
});
