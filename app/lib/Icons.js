import { Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { isIOS, isAndroid } from '../utils/deviceInfo';

const prefix = isIOS ? 'ios' : 'md';

// icon name from provider: [ size of the uri, icon provider, name to be used later ]
const icons = {
	[`${ prefix }-star`]: [25, Ionicons, 'star'],
	[`${ prefix }-star-outline`]: [25, Ionicons, 'starOutline'],
	[`${ prefix }-more`]: [25, Ionicons, 'more'],
	[`${ prefix }-create`]: [25, Ionicons, 'create'],
	[`${ prefix }-close`]: [25, Ionicons, 'close']
};

if (__DEV__) {
	icons[`${ prefix }-settings`] = [25, Ionicons, 'settings'];
	icons[`${ prefix }-add`] = [25, Ionicons, 'new_channel'];
	icons[`${ prefix }-more`] = [25, Ionicons, 'more'];
	if (isAndroid) {
		icons[`${ prefix }-search`] = [25, Ionicons, 'search'];
		icons[`${ prefix }-arrow-back`] = [25, Ionicons, 'back'];
	}
}

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

	isAndroidDev = () => __DEV__ && isAndroid

	getSource(icon, native = true) {
		if (this.isAndroidDev() || !native) {
			return this.icons[icon];
		}
		return { uri: icon, scale: Dimensions.get('window').scale };
	}
}

export default new Icons();
