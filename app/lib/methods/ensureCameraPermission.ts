import { Camera } from 'expo-camera';

export const ensureCameraPermission = async (): Promise<boolean> => {
	const current = await Camera.getCameraPermissionsAsync();
	if (current.granted) {
		return true;
	}
	if (!current.canAskAgain) {
		return false;
	}
	const requested = await Camera.requestCameraPermissionsAsync();
	return requested.granted;
};
