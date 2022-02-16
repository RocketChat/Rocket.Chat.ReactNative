import sdk from '../rocketchat/services/sdk';

export default function (updatedSince: Date) {
	// subscriptions.get: Since RC 0.60.0
	// rooms.get: Since RC 0.62.0
	if (updatedSince) {
		const updatedDate = updatedSince.toISOString();
		// TODO: missing definitions from server
		// @ts-ignore
		return Promise.all([sdk.get('subscriptions.get', { updatedDate }), sdk.get('rooms.get', { updatedDate })]);
	}
	// TODO: missing definitions from server
	// @ts-ignore
	return Promise.all([sdk.get('subscriptions.get'), sdk.get('rooms.get')]);
}
