import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import buildMessage from '../../methods/helpers/buildMessage';

export const createMessage = (db, message) => {
	db.action(async(action) => {
		const messagesCollection = db.collections.get('messages');
		message = buildMessage(message);
		console.log('TCL: createMessage -> message', message);
		let messageRecord;
		try {
			messageRecord = await messagesCollection.find(message.id);
			await messageRecord.update((m) => {
				m._raw = sanitizedRaw({
					...m._raw,
					...message
				}, messagesCollection.schema);
				m.ts = message.ts;
			});
			// await action.subAction(() => messageRecord.deleteRoles());
		} catch (error) {
			messageRecord = await messagesCollection.create((m) => {
				m._raw = sanitizedRaw({
					...message
				}, messagesCollection.schema);
				m.ts = message.ts;
			});
		}

		// if (subscription.roles) {
		// 	subscription.roles.forEach(async(role) => {
		// 		try {
		// 			await action.subAction(() => subscriptionRecord.addRole(role));
		// 		} catch (error) {
		// 			console.log('Error creating subscriptionRole -> error', error);
		// 		}
		// 	});
		// }
	});
};

export const getUpdatedSince = async(db) => {
	const subscriptionsCollection = db.collections.get('subscriptions');
	const subscriptions = await subscriptionsCollection.query().fetch();
	const sorted = subscriptions.sort((a, b) => a.roomUpdatedAt < b.roomUpdatedAt);
	return sorted[0] && sorted[0].roomUpdatedAt && sorted[0].roomUpdatedAt.toISOString();
};
