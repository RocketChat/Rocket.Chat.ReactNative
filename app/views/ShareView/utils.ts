import { Image as ImageCompressor, Video as CompressVideo } from 'react-native-compressor';

export const QUALITY_SD = 0.5;

export const compressImage = async (uri: string) => {
	try {
		const result = await ImageCompressor.compress(uri, {
			compressionMethod: 'manual',
			quality: QUALITY_SD
		});
		return result;
	} catch (error) {
		console.error('Image compression failed:', error);
		return uri; // Fallback to original URI
	}
};

export const compressVideo = async (uri: string) => {
	try {
		const result = await CompressVideo.compress(uri, {
			compressionMethod: 'auto'
		});
		return result;
	} catch (error) {
		console.error('Video compression failed:', error);
		return uri; // Fallback to original URI
	}
};
