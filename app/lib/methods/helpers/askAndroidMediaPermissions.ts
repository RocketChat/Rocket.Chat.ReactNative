import { Permission, PermissionsAndroid, Platform, Rationale } from 'react-native';

import i18n from '../../../i18n';

// Define a type for the permissions map
type PermissionsMap = { [key: string]: string };

/**
 * Rationale for requesting read permissions on Android.
 */
const readExternalStorageRationale: Rationale = {
	title: i18n.t('Read_External_Permission'),
	message: i18n.t('Read_External_Permission_Message'),
	buttonPositive: i18n.t('Ok')
};

/**
 * Checks if all requested permissions are granted.
 *
 * @param {PermissionsMap} permissionsStatus - The object containing the statuses of the permissions.
 * @param {string[]} permissions - The list of permissions to check.
 * @return {boolean} Whether all permissions are granted.
 */
const areAllPermissionsGranted = (permissionsStatus: PermissionsMap, permissions: string[]): boolean =>
	permissions.every(permission => permissionsStatus[permission] === PermissionsAndroid.RESULTS.GRANTED);

/**
 * Requests permission for reading media on Android.
 *
 * @return {Promise<boolean>} A promise that resolves to a boolean indicating whether the permissions were granted.
 */
export const askAndroidMediaPermissions = async (): Promise<boolean> => {
	if (Platform.OS !== 'android') return true;

	// For Android versions that require the new permissions model (API Level >= 33)
	if (Platform.constants.Version >= 33) {
		const permissions = [
			'android.permission.READ_MEDIA_IMAGES',
			'android.permission.READ_MEDIA_VIDEO',
			'android.permission.READ_MEDIA_AUDIO'
		];

		const permissionsStatus = await PermissionsAndroid.requestMultiple(permissions as Permission[]);
		return areAllPermissionsGranted(permissionsStatus, permissions);
	}

	// For older Android versions
	const result = await PermissionsAndroid.request(
		PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
		readExternalStorageRationale
	);

	return result === PermissionsAndroid.RESULTS.GRANTED;
};
