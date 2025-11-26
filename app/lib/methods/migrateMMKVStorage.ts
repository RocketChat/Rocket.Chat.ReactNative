// Platform-specific implementations exist for iOS and Android
// This base file is used for type resolution
// The actual implementation will be selected by React Native Metro bundler

const migrateFromOldMMKV = () => {
	console.log('MMKV migration - base implementation (should be overridden by platform-specific)');
};

export default migrateFromOldMMKV;
