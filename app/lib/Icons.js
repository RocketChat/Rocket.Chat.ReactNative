import { createIconSetFromIcoMoon } from 'react-native-vector-icons';

import icoMoonConfig from './selection.json';

const CustomIcon = createIconSetFromIcoMoon(
	icoMoonConfig,
	'custom',
	'custom.ttf'
);

export { CustomIcon };

// icon name from provider: [ size of the uri, icon provider, name to be used later ]
const icons = {
	'Star-filled': [25, CustomIcon, 'star'],
	star: [25, CustomIcon, 'starOutline'],
	menu: [25, CustomIcon, 'more'],
	edit: [25, CustomIcon, 'edit'],
	cross: [25, CustomIcon, 'close'],
	customize: [25, CustomIcon, 'settings'],
	magnifier: [25, CustomIcon, 'search'],
	'edit-rounded': [25, CustomIcon, 'new_channel']
};

class Icons {
	constructor() {
		this.icons = {};
	}

	async configure() {
		const promises = Object.keys(icons).map((icon) => {
			const Provider = icons[icon][1];
			return Provider.getImageSource(icon, icons[icon][0], '#FFF');
		});
		const sources = await Promise.all(promises);
		Object.keys(icons).forEach((icon, i) => (this.icons[icons[icon][2]] = sources[i]));
	}

	getSource(icon) {
		return this.icons[icon];
	}
}

export default new Icons();
