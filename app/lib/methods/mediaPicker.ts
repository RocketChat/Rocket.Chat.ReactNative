import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { PermissionsAndroid } from 'react-native';

import { isAndroid } from './helpers';
import log from './helpers/log';

export const pickImage = async (editImage = true): Promise<ImagePicker.ImagePickerResult | null> => {
	try {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: editImage,
			quality: 0
		});
		return result;
	} catch (error) {
		log(error);
		return null;
	}
};

export const pickVideo = async (editImage = true): Promise<ImagePicker.ImagePickerResult | null> => {
	try {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Videos,
			allowsEditing: editImage,
			quality: 0
		});
		return result;
	} catch (error) {
		log(error);
		return null;
	}
};

export const pickImageFromCamera = async (allowsEditing = false): Promise<ImagePicker.ImagePickerResult | null> => {
	try {
		if (isAndroid) {
			const permissions = await PermissionsAndroid.requestMultiple([
				PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
				PermissionsAndroid.PERMISSIONS.CAMERA
			]);
			if (permissions['android.permission.CAMERA'] !== 'granted') {
				return null;
			}
		} else {
			const permission = await ImagePicker.requestCameraPermissionsAsync();
			if (!permission.granted) {
				return null;
			}
		}

		const permission = await ImagePicker.getCameraPermissionsAsync();
		if (!permission.granted) {
			return null;
		}

		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
				mime: 'image/jpeg'
			};
			return data;
		}
		return null;
	} catch (error) {
		log(error);
		return null;
	}
};
