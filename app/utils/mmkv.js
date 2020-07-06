import MMKVStorage from 'react-native-mmkv-storage';

// MODES.MULTI_PROCESS = ACCESSIBLE BY APP GROUP (iOS)
export default new MMKVStorage.Loader().setProcessingMode(MMKVStorage.MODES.MULTI_PROCESS).initialize();
