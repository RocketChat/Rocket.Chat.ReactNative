import { Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const isIOS = Platform.OS === 'ios';
const prefix = isIOS ? 'ios' : 'md';

// icon name from provider: [ size of the uri, icon provider, name to be used later ]
const icons = {
	[`${ prefix }-star`]: [25, Ionicons, 'star'],
	[`${ prefix }-star-outline`]: [25, Ionicons, 'starOutline'],
	[`${ prefix }-more`]: [25, Ionicons, 'more'],
	[isIOS ? 'ios-create' : 'md-create']: [25, Ionicons, 'create'],
	[`${ prefix }-close`]: [25, Ionicons, 'close']
};

const iconsMap = {};
const iconsLoaded = async() => {
	const promises = Object.keys(icons).map((icon) => {
		const Provider = icons[icon][1];
		return Provider.getImageSource(icon, icons[icon][0], '#FFF');
	});
	const sources = await Promise.all(promises);
	Object.keys(icons).forEach((icon, i) => (iconsMap[icons[icon][2]] = sources[i]));
};

export { iconsLoaded, iconsMap };
