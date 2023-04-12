import { Image } from 'react-native';

export const isImageURL = async (url: string): Promise<boolean> => {
	try {
		const result = await Image.prefetch(url);
		return result;
	} catch {
		return false;
	}
};
