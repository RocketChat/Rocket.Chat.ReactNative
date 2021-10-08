import { NativeModules } from 'react-native';

import { isIOS } from './deviceInfo';

const { AppGroup } = NativeModules;

const appGroup = {
	path: isIOS ? AppGroup.path : ''
};

export default appGroup;
