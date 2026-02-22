import { NativeModules } from 'react-native';

// import { WatchModule } from './WatchModule';
export interface IWatchStatus {
	isSupported: boolean;
	isPaired: boolean;
	isWatchAppInstalled: boolean;
}

const { WatchBridge } = NativeModules;

export async function checkWatch(): Promise<IWatchStatus> {
	const status = (await WatchBridge.getWatchStatus()) as IWatchStatus;
	// const status = await WatchModule.getWatchStatus();
	return status;
}
