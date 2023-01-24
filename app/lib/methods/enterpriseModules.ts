import sdk from '../services/sdk';
import { store as reduxStore } from '../store/auxStore';
import database from '../database';
import log from './helpers/log';
import { clearEnterpriseModules, setEnterpriseModules as setEnterpriseModulesAction } from '../../actions/enterpriseModules';
import { compareServerVersion } from './helpers';

const LICENSE_OMNICHANNEL_MOBILE_ENTERPRISE = 'omnichannel-mobile-enterprise';
const LICENSE_LIVECHAT_ENTERPRISE = 'livechat-enterprise';

export async function setEnterpriseModules() {
	try {
		const { server: serverId } = reduxStore.getState().server;
		const serversDB = database.servers;
		const serversCollection = serversDB.get('servers');
		let server;
		try {
			server = await serversCollection.find(serverId);
		} catch {
			// Server not found
		}
		if (server?.enterpriseModules) {
			reduxStore.dispatch(setEnterpriseModulesAction(server.enterpriseModules.split(',')));
			return;
		}
		reduxStore.dispatch(clearEnterpriseModules());
	} catch (e) {
		log(e);
	}
}

export function getEnterpriseModules() {
	return new Promise<void>(async resolve => {
		try {
			const { version: serverVersion, server: serverId } = reduxStore.getState().server;
			if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.1.0')) {
				// RC 3.1.0
				const enterpriseModules = await sdk.methodCallWrapper('license:getModules');
				if (enterpriseModules) {
					const serversDB = database.servers;
					const serversCollection = serversDB.get('servers');
					const server = await serversCollection.find(serverId);
					await serversDB.write(async () => {
						await server.update(s => {
							s.enterpriseModules = enterpriseModules.join(',');
						});
					});
					reduxStore.dispatch(setEnterpriseModulesAction(enterpriseModules));
					return resolve();
				}
			}
			reduxStore.dispatch(clearEnterpriseModules());
		} catch (e) {
			log(e);
		}
		return resolve();
	});
}

export function isOmnichannelModuleAvailable() {
	const { enterpriseModules } = reduxStore.getState();
	return [LICENSE_OMNICHANNEL_MOBILE_ENTERPRISE, LICENSE_LIVECHAT_ENTERPRISE].some(module => enterpriseModules.includes(module));
}
