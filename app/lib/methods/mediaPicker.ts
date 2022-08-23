import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { PermissionsAndroid } from 'react-native';

import { isAndroid } from './helpers';
import log from './helpers/log';

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

const pickFromCamera = async (
	allowsEditing: boolean,
	mediaType: ImagePicker.MediaTypeOptions,
	mime: string
): Promise<ImagePicker.ImagePickerResult | null> => {
	try {
		const hasPermission = await handlePermission();
		if (!hasPermission) return null;
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: mediaType,
			quality: 1,
			allowsEditing
		});

		if (!result.cancelled) {
			const file = await FileSystem.getInfoAsync(result.uri);
			const data = {
				...result,
				path: result.uri,
				filename: `${file.uri.substring(file.uri.lastIndexOf('/') + 1)}`,
				size: file.size,
				mime
			};
			return data;
		}
		return null;
	} catch (error) {
		log(error);
		return null;
	}
};

export const pickImageAndVideoFromLibrary = async (): Promise<ImagePicker.ImagePickerMultipleResult | null> => {
	try {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			quality: undefined, // to force animated gifs
			allowsMultipleSelection: true
		});
		if (!result.cancelled) {
			return result;
		}
		return null;
	} catch (error) {
		log(error);
		return null;
	}
};

export const pickVideoFromCamera = (allowsEditing = false): Promise<ImagePicker.ImagePickerResult | null> =>
	pickFromCamera(allowsEditing, ImagePicker.MediaTypeOptions.Videos, 'video/mp4');

export const pickImageFromCamera = (allowsEditing = false): Promise<ImagePicker.ImagePickerResult | null> =>
	pickFromCamera(allowsEditing, ImagePicker.MediaTypeOptions.Images, 'image/jpeg');
