import { Image as ImageCompressor, Video as CompressVideo } from 'react-native-compressor';

export const QUALITY_SD = 0.5;

export const compressImage = async (uri: string) => {
	const result = await ImageCompressor.compress(uri);
	return result;
};

export const compressVideo = async (uri: string) => {
	const result = await CompressVideo.compress(uri);
	return result;
};
