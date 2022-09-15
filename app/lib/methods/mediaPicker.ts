import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { PermissionsAndroid } from 'react-native';
import * as mime from 'react-native-mime-types';

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
	mediaType: ImagePicker.MediaTypeOptions
): Promise<ImagePicker.ImagePickerResult | null> => {
	try {
		const hasPermission = await handlePermission();
		if (!hasPermission) return null;
		const image = await ImagePicker.launchCameraAsync({
			mediaTypes: mediaType,
			quality: 1,
			allowsEditing
		});

		if (!image.cancelled) {
			const file = await FileSystem.getInfoAsync(image.uri);
			const data = {
				...image,
				path: image.uri,
				filename: `${file.uri.substring(file.uri.lastIndexOf('/') + 1)}`,
				size: file.size,
				mime: mime.lookup(image.uri)
			};
			return data;
		}
		return null;
	} catch (error) {
		log(error);
		return null;
	}
};

export const pickImageAndVideoFromLibrary = async (): Promise<ImagePicker.ImagePickerResult[] | null> => {
	try {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			quality: undefined, // to force animated gifs
			allowsMultipleSelection: true
		});
		if (!result.cancelled) {
			const selectedFiles = result.selected.map(async file => {
				const fileInfo = await FileSystem.getInfoAsync(file.uri);
				return {
					...file,
					path: file.uri,
					filename: `${file.uri.substring(file.uri.lastIndexOf('/') + 1)}`,
					size: fileInfo.size,
					mime: mime.lookup(file.uri)
				};
			});
			const files = await Promise.all(selectedFiles);
			return files;
		}
		return null;
	} catch (error) {
		log(error);
		return null;
	}
};

export const pickVideoFromCamera = (allowsEditing = false): Promise<ImagePicker.ImagePickerResult | null> =>
	pickFromCamera(allowsEditing, ImagePicker.MediaTypeOptions.Videos);

export const pickImageFromCamera = (allowsEditing = false): Promise<ImagePicker.ImagePickerResult | null> =>
	pickFromCamera(allowsEditing, ImagePicker.MediaTypeOptions.Images);
