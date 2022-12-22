import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { PermissionsAndroid } from 'react-native';
import * as mime from 'react-native-mime-types';

import { isAndroid } from './helpers';
import log from './helpers/log';

interface ImagePickerFile extends ImagePicker.ImageInfo {
	path: string;
	filename: string;
	size?: number;
	mime: string;
}

const handlePermission = async (): Promise<boolean> => {
	if (isAndroid) {
		const permissions = await PermissionsAndroid.requestMultiple([
			PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
			PermissionsAndroid.PERMISSIONS.CAMERA
		]);
		if (permissions['android.permission.CAMERA'] !== 'granted') {
			return false;
		}
	} else {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) {
			return false;
		}
	}

	const permission = await ImagePicker.getCameraPermissionsAsync();
	if (!permission.granted) {
		return false;
	}

	return true;
};

const addAdditionalPropsToFile = async (file: ImagePicker.ImageInfo) => {
	const fileInfo = await FileSystem.getInfoAsync(file.uri);
	const data = {
		...file,
		path: file.uri,
		filename: `${file.uri.substring(file.uri.lastIndexOf('/') + 1)}`,
		size: fileInfo.size,
		mime: mime.lookup(file.uri)
	};
	return data;
};

const pickFromCamera = async (
	allowsEditing: boolean,
	mediaType: ImagePicker.MediaTypeOptions
): Promise<ImagePickerFile | null> => {
	try {
		const hasPermission = await handlePermission();
		if (!hasPermission) return null;
		const image = await ImagePicker.launchCameraAsync({
			mediaTypes: mediaType,
			quality: 0.8,
			allowsEditing
		});
		if (!image.cancelled) return addAdditionalPropsToFile(image);
		return null;
	} catch (error) {
		log(error);
		return null;
	}
};

export const pickMultipleImageAndVideoFromLibrary = async (): Promise<ImagePickerFile | ImagePickerFile[] | null> => {
	try {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			quality: isAndroid ? 1 : undefined, // TODO - Apply fix for iOS processing error
			allowsMultipleSelection: true
		});
		if (!result.cancelled) {
			if (result.selected) {
				const selectedFiles = result.selected.map(file => addAdditionalPropsToFile(file));
				const files = await Promise.all(selectedFiles);
				return files;
			}
			// @ts-ignore - The type for when returning only one file is wrong.
			const selectedFile = await addAdditionalPropsToFile(result);
			return [selectedFile];
		}
		return null;
	} catch (error) {
		log(error);
		return null;
	}
};

export async function pickImageFromLibrary({ animatedGif = true }: { animatedGif: boolean }): Promise<ImagePickerFile | null> {
	try {
		const image = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: animatedGif ? 1 : 0.8,
			base64: true
		});
		if (!image.cancelled) {
			const selectedImage = await addAdditionalPropsToFile(image);
			return selectedImage;
		}
		return null;
	} catch (error) {
		log(error);
		return null;
	}
}

export const pickVideoFromCamera = (allowsEditing = false): Promise<ImagePickerFile | null> =>
	pickFromCamera(allowsEditing, ImagePicker.MediaTypeOptions.Videos);

export const pickImageFromCamera = (allowsEditing = false): Promise<ImagePickerFile | null> =>
	pickFromCamera(allowsEditing, ImagePicker.MediaTypeOptions.Images);
