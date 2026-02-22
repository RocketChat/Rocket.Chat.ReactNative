import NativeWatchModule from '../../native/NativeWatchModule';

export interface IWatchStatus {
	isWatchSupported: boolean;
	isWatchPaired: boolean;
	isWatchAppInstalled: boolean;
}

export function checkWatch(): IWatchStatus {
	const status: IWatchStatus = {
		isWatchSupported: NativeWatchModule.isWatchSupported(),
		isWatchPaired: NativeWatchModule.isWatchPaired(),
		isWatchAppInstalled: NativeWatchModule.isWatchAppInstalled()
	};
	return status;
}
