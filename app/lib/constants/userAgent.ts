import DeviceInfo from 'react-native-device-info';

import { isIOS } from '../methods/helpers';

export const userAgent = isIOS
	? `Mozilla/5.0 (iPhone; CPU iPhone OS ${DeviceInfo.getSystemVersion().replace(
		'.',
		'_'
	)} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${DeviceInfo.getSystemVersion()} Mobile/15E148 Safari/604.1`
	: `Mozilla/5.0 (Linux; Android ${
		DeviceInfo.getSystemVersion().split('.')[0]
	}; ${DeviceInfo.getModel()}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36`;
