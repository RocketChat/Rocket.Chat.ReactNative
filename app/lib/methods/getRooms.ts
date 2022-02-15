import sdk from '../rocketchat/services/sdk';

export default function (updatedSince: Date) {
	let updatedDate = '';
	// subscriptions.get: Since RC 0.60.0
	// rooms.get: Since RC 0.62.0
	if (updatedSince) {
		updatedDate = updatedSince.toISOString();
		return Promise.all([
			sdk.get('subscriptions.get' as any, { updatedDate } as any),
			sdk.get('rooms.get' as any, { updatedDate } as any)
		]);
	}
	return Promise.all([sdk.get('subscriptions.get' as any), sdk.get('rooms.get' as any)]);
}
