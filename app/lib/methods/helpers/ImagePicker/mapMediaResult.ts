import { ImagePickerAsset } from 'expo-image-picker';

import { IShareAttachment } from '../../../../definitions';

export const mapMediaResult = (assets: ImagePickerAsset[]): IShareAttachment[] =>
	assets.map(asset => ({
		filename: asset.fileName || `${new Date().getTime().toString()}.jpg`,
		size: asset.fileSize || 0,
		mime: asset.mimeType,
		path: asset.uri,
		width: asset.width,
		height: asset.height,
		exif: {
			Orientation: asset.exif?.Orientation
		},
		base64: asset.base64
	}));
