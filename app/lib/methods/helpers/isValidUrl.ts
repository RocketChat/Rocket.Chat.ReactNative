import { URL } from 'react-native-url-polyfill';

export const isValidUrl = (link: string): boolean => {
	try {
		return Boolean(new URL(link));
	} catch (error) {
		return false;
	}
};
