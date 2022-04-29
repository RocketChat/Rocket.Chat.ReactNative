import { NativeModules } from 'react-native';

import { isIOS } from '../../utils/deviceInfo';

const { AppGroup } = NativeModules;

const appGroup: { path: string } = {
	path: isIOS ? AppGroup.path : ''
};

export default appGroup;
