import sdk from '../sdk';

export default function getUserInfo(userId: string): Promise<unknown> {
	// RC 0.48.0
	return sdk.get('users.info', { userId });
}
