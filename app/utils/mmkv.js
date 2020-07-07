import MMKVStorage from 'react-native-mmkv-storage';

import { getBundleId } from './deviceInfo';

export default new MMKVStorage.Loader()
	// MODES.MULTI_PROCESS = ACCESSIBLE BY APP GROUP (iOS)
	.setProcessingMode(MMKVStorage.MODES.MULTI_PROCESS)
	.withInstanceID(getBundleId)
	.withEncryption()
	.initialize();
