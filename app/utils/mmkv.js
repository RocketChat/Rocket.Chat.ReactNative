import MMKVStorage from 'react-native-mmkv-storage';

/*
 *	We can't use getBundleId here because
 *	it's different when using iOS Share Extension.
 */
const instanceID = 'chat.rocket.reactnative';

export default new MMKVStorage.Loader()
	// MODES.MULTI_PROCESS = ACCESSIBLE BY APP GROUP (iOS)
	.setProcessingMode(MMKVStorage.MODES.MULTI_PROCESS)
	.withInstanceID(instanceID)
	.withEncryption()
	.initialize();
