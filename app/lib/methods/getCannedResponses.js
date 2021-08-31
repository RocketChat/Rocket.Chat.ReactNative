import reduxStore from '../createStore';
import RocketChat from '../rocketchat';

export function getCannedResponses() {
	return new Promise(async(resolve) => {
		const { settings, permissions } = reduxStore.getState();

		const { Canned_Responses_Enable } = settings;

		if (!Canned_Responses_Enable) {
			return resolve();
		}

		const viewCannedResponses = permissions['view-canned-responses'];
		const permission = await RocketChat.hasPermission([viewCannedResponses]);

		if (!permission[0]) {
			return resolve();
		}

		try {
			const result = await this.sdk.get('canned-responses.get');
			console.log('🚀 ~ file: getCannedResponses.js ~ line 3 ~ getCannedResponses ~ result', result);

			if (!result.success) {
				return resolve();
			}
			return resolve();
		} catch (e) {
			console.log('🚀 ~ file: getCannedResponses.js ~ line 7 ~ returnnewPromise ~ e', e);
			return resolve();
		}
	});
}
