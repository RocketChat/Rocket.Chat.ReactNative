import * as ImagePicker from 'expo-image-picker';

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

export const pickImageFromCamera = async (): Promise<ImagePicker.ImagePickerResult | null> => {
	try {
		const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
		console.log(permissionResult);
		if (permissionResult.granted === false) {
			return null;
		}

		const result = await ImagePicker.launchCameraAsync();

		console.log(result);

		if (!result.cancelled) {
			console.log(result);
			return result;
		}
		return null;
	} catch (error) {
		log(error);
		return null;
	}
};
