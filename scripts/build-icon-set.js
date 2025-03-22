const fs = require('fs');
const customIcons = require('../app/containers/CustomIcon/selection.json');

const sortObject = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});

let icons = {};

// map icons
customIcons.icons.forEach((icon) => {
	icon.properties.name.split(/\s*,\s*/g).forEach((name) => {
		icons = {...icons, [name]: icon.properties.code};
	});
});

// sort icons by name
icons = sortObject(icons);

// generate mappedIcons file
let mappedIcons = 'export const mappedIcons = {\n';

// map icons to file
Object.keys(icons).forEach((icon)=> {
	mappedIcons += `\t'${icon}': ${icons[icon]},\n`;
});

// close file
mappedIcons = `${mappedIcons.slice(0, -2) }\n};\n`;

// write file
fs.writeFile('app/containers/CustomIcon/mappedIcons.js', mappedIcons, 'utf8', function (err) {
	if (err) {
		console.log('An error occurred while writing Object to File.');
		console.log(err);
		return;
	}

	console.log('🚀 Icons name generated.');
});
