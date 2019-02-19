import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

export const createSubscription = (db, subscription) => {
	db.action(async(action) => {
		const subscriptionsCollection = db.collections.get('subscriptions');
		let subscriptionRecord;
		try {
			subscriptionRecord = await subscriptionsCollection.find(subscription.id);
			await subscriptionRecord.update((s) => {
				s._raw = sanitizedRaw({
					...subscription
				}, subscriptionsCollection.schema);
				s.ts = subscription.ts;
				s.ls = subscription.ls;
				s.roomUpdatedAt = subscription.room_updated_at;
			});
			await action.subAction(() => subscriptionRecord.deleteRoles());
		} catch (error) {
			subscriptionRecord = await subscriptionsCollection.create((s) => {
				s._raw = sanitizedRaw({
					...subscription
				}, subscriptionsCollection.schema);
				s.ts = subscription.ts;
				s.ls = subscription.ls;
				s.roomUpdatedAt = subscription.room_updated_at;
			});
		}

		if (subscription.roles) {
			subscription.roles.forEach(async(role) => {
				try {
					await action.subAction(() => subscriptionRecord.addRole(role));
				} catch (error) {
					console.log('Error creating subscriptionRole -> error', error);
				}
			});
		}
	});
};

export const getUpdatedSince = async(db) => {
	const subscriptionsCollection = db.collections.get('subscriptions');
	const subscriptions = await subscriptionsCollection.query().fetch();
	const sorted = subscriptions.sort((a, b) => a.roomUpdatedAt < b.roomUpdatedAt);
	return sorted[0] && sorted[0].roomUpdatedAt && sorted[0].roomUpdatedAt.toISOString();
};
