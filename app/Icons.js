import { Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const isIOS = Platform.OS === 'ios';
const prefix = isIOS ? 'ios' : 'md';

// icon name from provider: [ size of the uri, icon provider, name to be used later ]
const icons = {
	[`${ prefix }-search`]: [30, Ionicons, 'search'],
	[`${ prefix }-menu`]: [30, Ionicons, 'menu'],
	[`${ prefix }-star`]: [30, Ionicons, 'star'],
	[`${ prefix }-star-outline`]: [30, Ionicons, 'starOutline'],
	[isIOS ? 'ios-create' : 'md-create']: [30, Ionicons, 'create'],
	[`${ prefix }-more`]: [30, Ionicons, 'more'],
	[`${ prefix }-add`]: [30, Ionicons, 'add'],
	[`${ prefix }-close`]: [30, Ionicons, 'close']
};

const iconsMap = {};
const iconsLoaded = async() => {
	const promises = Object.keys(icons).map((icon) => {
		const Provider = icons[icon][1];
		return Provider.getImageSource(icon, icons[icon][0]);
	});
	const sources = await Promise.all(promises);
	Object.keys(icons).forEach((icon, i) => (iconsMap[icons[icon][2]] = sources[i]));
};

export { iconsLoaded, iconsMap };
