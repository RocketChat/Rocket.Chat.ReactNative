import database from '../realm';

const lastMessage = () => {
	const message = database
		.objects('subscriptions')
		.sorted('roomUpdatedAt', true)[0];
	return message && new Date(message.roomUpdatedAt).toISOString();
};

export default function() {
	const updatedSince = lastMessage();
	// subscriptions.get: Since RC 0.60.0
	// rooms.get: Since RC 0.62.0
	if (updatedSince) {
		return Promise.all([this.sdk.get('subscriptions.get', { updatedSince }), this.sdk.get('rooms.get', { updatedSince })]);
	}
	return Promise.all([this.sdk.get('subscriptions.get'), this.sdk.get('rooms.get')]);
}
