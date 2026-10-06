import sdk from '../services/sdk';
import { store as reduxStore } from '../store/auxStore';
import database from '../database';
import log from './helpers/log';
import { clearEnterpriseModules, setEnterpriseModules as setEnterpriseModulesAction } from '~/actions/enterpriseModules';
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

async function fetchEnterpriseModules(serverVersion: string): Promise<string[] | undefined> {
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '6.5.0')) {
		const licensesInfo = await sdk.get('licenses.info');
		return licensesInfo.success ? licensesInfo.license.activeModules : undefined;
	}
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.1.0')) {
		return sdk.methodCallWrapper('license:getModules');
	}
}

export async function getEnterpriseModules() {
	try {
		const { version: serverVersion, server: serverId } = reduxStore.getState().server;
		const enterpriseModules = await fetchEnterpriseModules(serverVersion);
		if (!enterpriseModules) {
			reduxStore.dispatch(clearEnterpriseModules());
			return;
		}
		const serversDB = database.servers;
		const server = await serversDB.get('servers').find(serverId);
		await serversDB.write(async () => {
			await server.update(s => {
				s.enterpriseModules = enterpriseModules.join(',');
			});
		});
		reduxStore.dispatch(setEnterpriseModulesAction(enterpriseModules));
	} catch (e) {
		log(e);
	}
}

export function isOmnichannelModuleAvailable() {
	const { enterpriseModules } = reduxStore.getState();
	return [LICENSE_OMNICHANNEL_MOBILE_ENTERPRISE, LICENSE_LIVECHAT_ENTERPRISE].some(module => enterpriseModules.includes(module));
}

export function isVoipModuleAvailable() {
	const { enterpriseModules } = reduxStore.getState();
	return enterpriseModules.includes('teams-voip');
}
