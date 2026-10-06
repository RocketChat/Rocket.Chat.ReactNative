import UserPreferences from './userPreferences';
import { getBasicAuthKey } from '../constants/keys';

export const getBasicAuthHeader = (server: string): string | undefined => {
	const basicAuth = UserPreferences.getString(getBasicAuthKey(server));
	return basicAuth ? `Basic ${basicAuth}` : undefined;
};
