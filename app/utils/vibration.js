import { Vibration } from 'react-native';

import { isAndroid } from './deviceInfo';

const vibrate = () => {
	if (isAndroid) {
		Vibration.vibrate(30);
	}
};

export { vibrate };
