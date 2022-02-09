import sdk from './sdk';

export default function getUserInfo(userId: string) {
	// RC 0.48.0
	return sdk.get('users.info', { userId });
}
