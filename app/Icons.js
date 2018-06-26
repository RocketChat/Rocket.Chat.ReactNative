import Ionicons from 'react-native-vector-icons/Ionicons';

const icons = {
	'md-search': [30, Ionicons],
	'md-menu': [30, Ionicons],
	'md-star': [30, Ionicons],
	'md-star-outline': [30, Ionicons],
	'md-create-outline': [30, Ionicons],
	'md-more': [30, Ionicons],
	'md-add': [30, Ionicons]
};

const iconsMap = {};
const iconsLoaded = async() => {
	const promises = Object.keys(icons).map((icon) => {
		const Provider = icons[icon][1];
		return Provider.getImageSource(icon, icons[icon][0]);
	});
	const sources = await Promise.all(promises);
	Object.keys(icons).forEach((iconName, i) => (iconsMap[iconName] = sources[i]));
};

export { iconsLoaded, iconsMap };
