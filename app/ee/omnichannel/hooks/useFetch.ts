import fetch from '../../../utils/fetch';
import sdk from '../../../lib/rocketchat/services/sdk';

export const fetchteste = async ({ icon, appId }: { icon: string; appId: string }) => {
	const { userId, authToken } = sdk.current.currentLogin;
	const { host } = sdk.current.client;

	const result = await fetch(`${host}/api/apps/public/${appId}/get-sidebar-icon?icon=${icon}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId
		}
	});
	console.log('🚀 ~ file: useFetch.ts ~ line 17 ~ fetchteste ~ result', result);

	return result;
};
