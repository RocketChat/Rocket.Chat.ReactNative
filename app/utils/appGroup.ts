import { NativeModules } from 'react-native';

import { isIOS } from './deviceInfo';

const { AppGroup } = NativeModules;

const appGroup: { path: string } = {
	path: isIOS ? AppGroup.path : ''
};

export default appGroup;
