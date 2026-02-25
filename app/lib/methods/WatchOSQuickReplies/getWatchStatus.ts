import NativeWatchModule from '../../native/NativeWatchModule';
import { isAndroid } from '../helpers';

export interface IWatchStatus {
	isWatchSupported: boolean;
	isWatchPaired: boolean;
	isWatchAppInstalled: boolean;
}

export function checkWatch(): IWatchStatus {
	if (isAndroid || !NativeWatchModule)
		return {
			isWatchSupported: false,
			isWatchPaired: false,
			isWatchAppInstalled: false
		};
	const status: IWatchStatus = {
		isWatchSupported: NativeWatchModule.isWatchSupported(),
		isWatchPaired: NativeWatchModule.isWatchPaired(),
		isWatchAppInstalled: NativeWatchModule.isWatchAppInstalled()
	};
	return status;
}

export const shouldShowWatchAppOptions = (): boolean => {
	if (isAndroid || !NativeWatchModule) return false;
	const watchStatus = checkWatch();

	console.log(watchStatus);
	if (!watchStatus.isWatchSupported || !watchStatus.isWatchAppInstalled) return false;
	return true;
};
