import sdk from '../services/sdk';

export function getRooms(updatedSince: Date) {
	// subscriptions.get: Since RC 0.60.0
	// rooms.get: Since RC 0.62.0
	if (updatedSince) {
		const updatedDate = updatedSince.toISOString();
		// TODO: missing definitions from server
		return Promise.all([
			// @ts-ignore
			sdk.get('/v1/subscriptions.get', { updatedSince: updatedDate }),
			// @ts-ignore
			sdk.get('/v1/rooms.get', { updatedSince: updatedDate })
		]);
	}
	// TODO: missing definitions from server
	// @ts-ignore
	return Promise.all([sdk.get('/v1/subscriptions.get', {}), sdk.get('/v1/rooms.get', {})]);
}
