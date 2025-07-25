export type SubscriptionsEndpoints = {
	'subscriptions.unread': {
		POST: (params: { firstUnreadMessage: { _id: string } } | { roomId: string }) => {};
	};
	'subscriptions.read': {
		POST: (params: { rid: string; readThreads?: boolean }) => {};
	};
};
