type TPushInfo = {
	pushGatewayEnabled: boolean;
	defaultPushGateway: boolean;
	success: boolean;
};

export type PushEndpoints = {
	'push.token': {
		POST: (params: { value: string; type: string; appName: string }) => {
			result: {
				id: string;
				token: string;
				appName: string;
				userId: string;
			};
		};
		DELETE: (params: { token: string }) => { success: boolean };
	};
	'push.info': {
		GET: () => TPushInfo;
	};
	'push.test': {
		POST: () => { tokensCount: number };
	};
};
