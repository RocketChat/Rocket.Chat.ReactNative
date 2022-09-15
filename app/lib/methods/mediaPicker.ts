/* eslint-disable no-redeclare */
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
			quality: 1,
			allowsEditing
		});
		if (!image.cancelled) return addAdditionalPropsToFile(image);
		return null;
	} catch (error) {
		log(error);
		return null;
	}
};

export const pickMultipleImageAndVideoFromLibrary = async (): Promise<ImagePickerFile[] | null> => {
	try {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			quality: undefined, // to force animated gifs
			allowsMultipleSelection: true
		});
		if (!result.cancelled) {
			const selectedFiles = result.selected.map(file => addAdditionalPropsToFile(file));
			const files = await Promise.all(selectedFiles);
			return files;
		}
		return null;
	} catch (error) {
		log(error);
		return null;
	}
};

// Function Overload - https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads
export async function pickImageFromLibrary(base64: true): Promise<(ImagePickerFile & { data: string }) | null>;
export async function pickImageFromLibrary(base64?: false): Promise<ImagePickerFile | null>;
export async function pickImageFromLibrary(base64?: boolean): Promise<ImagePickerFile | (ImagePickerFile & { data: string }) | null> {
	try {
		const image = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: undefined, // to force animated gifs
			base64
		});
		if (!image.cancelled) return addAdditionalPropsToFile(image);
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
