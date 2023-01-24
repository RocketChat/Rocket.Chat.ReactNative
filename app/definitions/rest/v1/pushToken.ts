export type PushTokenEndpoints = {
	'push.token': {
		POST: (params: { value: string; type: string; appName: string }) => {
			result: {
				id: string;
				token: string;
				appName: string;
				userId: string;
			};
		};
	};
};
