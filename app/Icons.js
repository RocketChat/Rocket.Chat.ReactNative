import Ionicons from 'react-native-vector-icons/Ionicons';

const icons = {
	'ios-search': [30, Ionicons],
	'ios-menu': [30, Ionicons],
	'ios-star': [30, Ionicons],
	'ios-star-outline': [30, Ionicons],
	'ios-create-outline': [30, Ionicons],
	'ios-more': [30, Ionicons],
	'ios-add': [30, Ionicons],
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
