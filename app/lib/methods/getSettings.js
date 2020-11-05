import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';

import { addSettings, clearSettings } from '../../actions/settings';
import RocketChat from '../rocketchat';
import reduxStore from '../createStore';
import settings from '../../constants/settings';
import log from '../../utils/log';
import database from '../database';
import protectedFunction from './helpers/protectedFunction';
import fetch from '../../utils/fetch';
import { DEFAULT_AUTO_LOCK } from '../../constants/localAuthentication';

const serverInfoKeys = [
	'Site_Name',
	'UI_Use_Real_Name',
	'FileUpload_MediaTypeWhiteList',
	'FileUpload_MaxFileSize',
	'Force_Screen_Lock',
	'Force_Screen_Lock_After',
	'uniqueID',
	'E2E_Enable'
];

// these settings are used only on onboarding process
const loginSettings = [
	'API_Gitlab_URL',
	'CAS_enabled',
	'CAS_login_url',
	'Accounts_EmailVerification',
	'Accounts_ManuallyApproveNewUsers',
	'Accounts_ShowFormLogin',
	'Site_Url',
	'Accounts_RegistrationForm',
	'Accounts_RegistrationForm_LinkReplacementText',
	'Accounts_EmailOrUsernamePlaceholder',
	'Accounts_PasswordPlaceholder',
	'Accounts_PasswordReset',
	'Accounts_iframe_enabled',
	'Accounts_Iframe_api_url',
	'Accounts_Iframe_api_method'
];

const serverInfoUpdate = async(serverInfo, iconSetting) => {
	const serversDB = database.servers;
	const serverId = reduxStore.getState().server.server;
	const serversCollection = serversDB.collections.get('servers');
	const server = await serversCollection.find(serverId);

	let info = serverInfo.reduce((allSettings, setting) => {
		if (setting._id === 'Site_Name') {
			return { ...allSettings, name: setting.valueAsString };
		}
		if (setting._id === 'UI_Use_Real_Name') {
			return { ...allSettings, useRealName: setting.valueAsBoolean };
		}
		if (setting._id === 'FileUpload_MediaTypeWhiteList') {
			return { ...allSettings, FileUpload_MediaTypeWhiteList: setting.valueAsString };
		}
		if (setting._id === 'FileUpload_MaxFileSize') {
			return { ...allSettings, FileUpload_MaxFileSize: setting.valueAsNumber };
		}
		if (setting._id === 'Force_Screen_Lock') {
			// if this was disabled on server side we must keep this enabled on app
			const autoLock = server.autoLock || setting.valueAsBoolean;
			return { ...allSettings, autoLock };
		}
		if (setting._id === 'Force_Screen_Lock_After') {
			const forceScreenLock = serverInfo.find(s => s._id === 'Force_Screen_Lock')?.valueAsBoolean;

			// if Force_Screen_Lock_After === 0 and autoLockTime is null, set app's default value
			if (setting.valueAsNumber === 0 && !server.autoLockTime) {
				return { ...allSettings, autoLockTime: DEFAULT_AUTO_LOCK };
			}
			// if Force_Screen_Lock_After > 0 and forceScreenLock is enabled, use it
			if (setting.valueAsNumber > 0 && forceScreenLock) {
				return { ...allSettings, autoLockTime: setting.valueAsNumber };
			}
		}
		if (setting._id === 'uniqueID') {
			return { ...allSettings, uniqueID: setting.valueAsString };
		}
		if (setting._id === 'E2E_Enable') {
			return { ...allSettings, E2E_Enable: setting.valueAsBoolean };
		}
		return allSettings;
	}, {});

	if (iconSetting) {
		const iconURL = `${ serverId }/${ iconSetting.value.url || iconSetting.value.defaultUrl }`;
		info = { ...info, iconURL };
	}

	await serversDB.action(async() => {
		try {
			await server.update((record) => {
				Object.assign(record, info);
			});
		} catch (e) {
			log(e);
		}
	});
};

export async function getLoginSettings({ server }) {
	try {
		const settingsParams = JSON.stringify(loginSettings);
		const result = await fetch(`${ server }/api/v1/settings.public?query={"_id":{"$in":${ settingsParams }}}`).then(response => response.json());

		if (result.success && result.settings.length) {
			reduxStore.dispatch(clearSettings());
			reduxStore.dispatch(addSettings(this.parseSettings(this._prepareSettings(result.settings))));
		}
	} catch (e) {
		log(e);
	}
}

export async function setSettings() {
	const db = database.active;
	const settingsCollection = db.collections.get('settings');
	const settingsRecords = await settingsCollection.query().fetch();
	const parsed = Object.values(settingsRecords).map(item => ({
		_id: item.id,
		valueAsString: item.valueAsString,
		valueAsBoolean: item.valueAsBoolean,
		valueAsNumber: item.valueAsNumber,
		valueAsArray: item.valueAsArray,
		_updatedAt: item._updatedAt
	}));
	reduxStore.dispatch(addSettings(RocketChat.parseSettings(parsed.slice(0, parsed.length))));
}

export default async function() {
	try {
		const db = database.active;
		const settingsParams = JSON.stringify(Object.keys(settings).filter(key => !loginSettings.includes(key)));
		// RC 0.60.0
		const result = await fetch(`${ this.sdk.client.host }/api/v1/settings.public?query={"_id":{"$in":${ settingsParams }}}`).then(response => response.json());

		if (!result.success) {
			return;
		}
		const data = result.settings || [];
		const filteredSettings = this._prepareSettings(data);
		const filteredSettingsIds = filteredSettings.map(s => s._id);

		reduxStore.dispatch(addSettings(this.parseSettings(filteredSettings)));

		// filter server info
		const serverInfo = filteredSettings.filter(i1 => serverInfoKeys.includes(i1._id));
		const iconSetting = data.find(item => item._id === 'Assets_favicon_512');
		try {
			await serverInfoUpdate(serverInfo, iconSetting);
		} catch {
			// Server not found
		}

		await db.action(async() => {
			const settingsCollection = db.collections.get('settings');
			const allSettingsRecords = await settingsCollection
				.query(Q.where('id', Q.oneOf(filteredSettingsIds)))
				.fetch();

			// filter settings
			let settingsToCreate = filteredSettings.filter(i1 => !allSettingsRecords.find(i2 => i1._id === i2.id));
			let settingsToUpdate = allSettingsRecords.filter(i1 => filteredSettings.find(i2 => i1.id === i2._id));

			// Create
			settingsToCreate = settingsToCreate.map(setting => settingsCollection.prepareCreate(protectedFunction((s) => {
				s._raw = sanitizedRaw({ id: setting._id }, settingsCollection.schema);
				Object.assign(s, setting);
			})));

			// Update
			settingsToUpdate = settingsToUpdate.map((setting) => {
				const newSetting = filteredSettings.find(s => s._id === setting.id);
				return setting.prepareUpdate(protectedFunction((s) => {
					Object.assign(s, newSetting);
				}));
			});

			const allRecords = [
				...settingsToCreate,
				...settingsToUpdate
			];

			try {
				await db.batch(...allRecords);
			} catch (e) {
				log(e);
			}
			return allRecords.length;
		});
	} catch (e) {
		log(e);
	}
}
