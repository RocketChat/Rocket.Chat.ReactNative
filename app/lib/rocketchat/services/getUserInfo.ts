import { SDK } from './sdk';

export default function getUserInfo(userId: string): Promise<unknown> {
	const sdk = new SDK();
	// RC 0.48.0
	return sdk.get('users.info', { userId });
}
