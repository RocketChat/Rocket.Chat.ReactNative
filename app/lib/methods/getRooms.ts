import { IRocketChat } from '../../definitions/IRocketChat';

export default function (this: IRocketChat, updatedSince: Date) {
	let updatedDate = '';
	// subscriptions.get: Since RC 0.60.0
	// rooms.get: Since RC 0.62.0
	if (updatedSince) {
		updatedDate = updatedSince.toISOString();
		return Promise.all([this.sdk.get('subscriptions.get', { updatedDate }), this.sdk.get('rooms.get', { updatedDate })]);
	}
	return Promise.all([this.sdk.get('subscriptions.get'), this.sdk.get('rooms.get')]);
}
