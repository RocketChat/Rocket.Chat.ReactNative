import { NativeModules } from 'react-native';

const { WatchBridge } = NativeModules;

export async function checkWatch() {
	const status = await WatchBridge.getWatchStatus();

	return status;
}
