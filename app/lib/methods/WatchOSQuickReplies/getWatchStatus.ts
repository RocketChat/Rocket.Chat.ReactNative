import NativeWatchModule from '../../native/NativeWatchModule';
import { isAndroid } from '../helpers';

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

export const shouldShowWatchAppOptions = (): boolean => {
	const watchStatus = checkWatch();

	console.log(watchStatus);
	if (isAndroid || !watchStatus.isWatchSupported || !watchStatus.isWatchAppInstalled) return false;
	return true;
};
