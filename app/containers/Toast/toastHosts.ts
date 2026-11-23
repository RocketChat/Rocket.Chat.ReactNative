import type EasyToast from 'react-native-easy-toast';

const mountedHosts: EasyToast[] = [];

export const registerToastHost = (host: EasyToast): (() => void) => {
	mountedHosts.push(host);
	return () => {
		const index = mountedHosts.indexOf(host);
		if (index > -1) {
			mountedHosts.splice(index, 1);
		}
	};
};

export const isTopToastHost = (host: EasyToast): boolean => mountedHosts.at(-1) === host;
