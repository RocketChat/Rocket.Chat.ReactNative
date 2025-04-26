import { Image as ImageCompressor, Video as CompressVideo } from 'react-native-compressor';

export const QUALITY_SD = 0.5;
export const QUALITY_HD = 1;

export const compressImage = async (uri: string, quality: string) => {
	const result = await ImageCompressor.compress(uri, {
		compressionMethod: 'manual',
		maxWidth: 1000,
		quality: quality === 'SD' ? QUALITY_SD : QUALITY_HD
	});
	return result;
};

export const compressVideo = async (uri: string, quality: string) => {
	if (quality === 'HD') {
		return uri;
	}

	const result = await CompressVideo.compress(uri, {
		compressionMethod: 'manual', // or 'auto' depending on your requirement
		bitrate: 1000000, // 1 Mbps for SD quality
		maxSize: 5000000, // Max file size 5MB for SD (optional)
		progressDivider: 10 // Adjust for how often you get progress updates
	});
	return result;
};
