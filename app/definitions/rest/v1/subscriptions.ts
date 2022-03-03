export type SubscriptionsEndpoints = {
	'subscriptions.unread': {
		POST: (params: { firstUnreadMessage: { _id: string } }) => {};
	};
};
