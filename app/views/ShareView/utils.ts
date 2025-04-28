import { Image as ImageCompressor, Video as CompressVideo } from 'react-native-compressor';

export type TQuality = 'SD' | 'HD';
export const QUALITY_SD = 0.5;

export const compressImage = async (uri: string, quality: TQuality) => {
	const result = await ImageCompressor.compress(uri, {
		compressionMethod: 'manual',
		maxWidth: 1000,
		quality: quality === 'SD' ? QUALITY_SD : 1
	});
	return result;
};

export const compressVideo = async (uri: string, quality: TQuality) => {
	if (quality === 'HD') {
		return uri;
	}

	const result = await CompressVideo.compress(uri, {
		compressionMethod: 'manual',
		bitrate: 1000000,
		maxSize: 5000000,
		progressDivider: 10
	});
	return result;
};
