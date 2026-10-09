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
		if (server?.enterpriseModules || server?.hasValidLicense) {
			const modules = server.enterpriseModules ? server.enterpriseModules.split(',') : [];
			reduxStore.dispatch(setEnterpriseModulesAction(modules, Boolean(server.hasValidLicense)));
			return;
		}
		reduxStore.dispatch(clearEnterpriseModules());
	} catch (e) {
		log(e);
	}
}

interface ILicenseState {
	modules: string[];
	hasValidLicense: boolean;
}

async function fetchLicenseState(serverVersion: string): Promise<ILicenseState | undefined> {
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '6.5.0')) {
		const licensesInfo = await sdk.get('licenses.info');
		if (!licensesInfo.success) {
			return;
		}
		return { modules: licensesInfo.license.activeModules, hasValidLicense: Boolean(licensesInfo.license.hasValidLicense) };
	}
	if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.1.0')) {
		const modules: string[] | undefined = await sdk.methodCallWrapper('license:getModules');
		return modules && { modules, hasValidLicense: false };
	}
}

export async function getEnterpriseModules() {
	try {
		const { version: serverVersion, server: serverId } = reduxStore.getState().server;
		const licenseState = await fetchLicenseState(serverVersion);
		if (!licenseState) {
			reduxStore.dispatch(clearEnterpriseModules());
			return;
		}
		const { modules, hasValidLicense } = licenseState;
		const serversDB = database.servers;
		const server = await serversDB.get('servers').find(serverId);
		await serversDB.write(async () => {
			await server.update(s => {
				s.enterpriseModules = modules.join(',');
				s.hasValidLicense = hasValidLicense;
			});
		});
		reduxStore.dispatch(setEnterpriseModulesAction(modules, hasValidLicense));
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
