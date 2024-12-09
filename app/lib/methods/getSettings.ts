import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { addSettings, clearSettings } from '../../actions/settings';
import { DEFAULT_AUTO_LOCK, defaultSettings } from '../constants';
import { IPreparedSettings, ISettingsIcon } from '../../definitions';
import fetch from './helpers/fetch';
import log from './helpers/log';
import { store as reduxStore } from '../store/auxStore';
import database from '../database';
import sdk from '../services/sdk';
import protectedFunction from './helpers/protectedFunction';
import { parseSettings, _prepareSettings } from './parseSettings';
import { setPresenceCap } from './getUsersPresence';
import { compareServerVersion } from './helpers';

const serverInfoKeys = [
	'Site_Name',
	'UI_Use_Real_Name',
	'FileUpload_MediaTypeWhiteList',
	'FileUpload_MaxFileSize',
	'Force_Screen_Lock',
	'Force_Screen_Lock_After',
	'uniqueID',
	'E2E_Enable',
	'E2E_Enabled_Default_PrivateRooms'
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

const serverInfoUpdate = async (serverInfo: IPreparedSettings[], iconSetting: ISettingsIcon) => {
	const serversDB = database.servers;
	const serverId = reduxStore.getState().server.server;
	const serversCollection = serversDB.get('servers');
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
			if (setting.valueAsNumber && setting.valueAsNumber > 0 && forceScreenLock) {
				return { ...allSettings, autoLockTime: setting.valueAsNumber };
			}
		}
		if (setting._id === 'uniqueID') {
			return { ...allSettings, uniqueID: setting.valueAsString };
		}
		if (setting._id === 'E2E_Enable') {
			return { ...allSettings, E2E_Enable: setting.valueAsBoolean };
		}
		if (setting._id === 'E2E_Enabled_Default_PrivateRooms') {
			return { ...allSettings, E2E_Enabled_Default_PrivateRooms: setting.valueAsBoolean };
		}
		return allSettings;
	}, {});

	if (iconSetting) {
		const iconURL = `${serverId}/${iconSetting.value.url || iconSetting.value.defaultUrl}`;
		info = { ...info, iconURL };
	}

	await serversDB.write(async () => {
		try {
			await server.update(record => {
				Object.assign(record, info);
			});
		} catch (e) {
			log(e);
		}
	});
};

export async function getLoginSettings({ server, serverVersion }: { server: string; serverVersion: string }): Promise<void> {
	const settingsParams = JSON.stringify(loginSettings);

	const url = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')
		? `${server}/api/v1/settings.public?_id=${loginSettings.join(',')}`
		: `${server}/api/v1/settings.public?query={"_id":{"$in":${settingsParams}}}`;
	try {
		const result = await fetch(url).then(response => response.json());

		if (result.success && result.settings.length) {
			reduxStore.dispatch(clearSettings());
			reduxStore.dispatch(addSettings(parseSettings(_prepareSettings(result.settings))));
		}
	} catch (e) {
		log(e);
	}
}

export async function setSettings(): Promise<void> {
	const db = database.active;
	const settingsCollection = db.get('settings');
	const settingsRecords = await settingsCollection.query().fetch();
	const parsed = Object.values(settingsRecords).map(item => ({
		_id: item.id,
		valueAsString: item.valueAsString,
		valueAsBoolean: item.valueAsBoolean,
		valueAsNumber: item.valueAsNumber,
		valueAsArray: item.valueAsArray,
		_updatedAt: item._updatedAt
	}));
	reduxStore.dispatch(addSettings(parseSettings(parsed.slice(0, parsed.length))));
}

export function subscribeSettings(): void {
	return sdk.subscribe('stream-notify-all', 'public-settings-changed');
}

type IData = ISettingsIcon | IPreparedSettings;

export async function getSettings(): Promise<void> {
	try {
		const db = database.active;
		const settingsParams = Object.keys(defaultSettings).filter(key => !loginSettings.includes(key));
		// RC 0.60.0
		let offset = 0;
		let remaining;
		let settings: IData[] = [];
		const serverVersion = reduxStore.getState().server.version;
		const url = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')
			? `${sdk.current.client.host}/api/v1/settings.public?_id=${settingsParams.join(',')}`
			: `${sdk.current.client.host}/api/v1/settings.public?query={"_id":{"$in":${JSON.stringify(settingsParams)}}}`;
		// Iterate over paginated results to retrieve all settings
		do {
			// TODO: why is no-await-in-loop enforced in the first place?
			/* eslint-disable no-await-in-loop */
			const response = await fetch(`${url}&offset=${offset}`);

			const result = await response.json();
			if (!result.success) {
				return;
			}

			offset += result.settings.length;
			settings = [...settings, ...result.settings];
			remaining = result.total - settings.length;
			/* eslint-enable no-await-in-loop */
		} while (remaining > 0);

		const data: IData[] = settings;
		const filteredSettings: IPreparedSettings[] = _prepareSettings(data);
		const filteredSettingsIds = filteredSettings.map(s => s._id);
		const parsedSettings = parseSettings(filteredSettings);

		reduxStore.dispatch(addSettings(parsedSettings));

		setPresenceCap(parsedSettings.Presence_broadcast_disabled);

		// filter server info
		const serverInfo = filteredSettings.filter(i1 => serverInfoKeys.includes(i1._id));
		const iconSetting = data.find(icon => icon._id === 'Assets_favicon_512');
		try {
			await serverInfoUpdate(serverInfo, iconSetting as ISettingsIcon);
		} catch {
			// Server not found
		}

		await db.write(async () => {
			const settingsCollection = db.get('settings');
			const allSettingsRecords = await settingsCollection.query(Q.where('id', Q.oneOf(filteredSettingsIds))).fetch();

			// filter settings
			const settingsToCreate = filteredSettings.filter(i1 => !allSettingsRecords.find(i2 => i1._id === i2.id));
			const settingsToUpdate = allSettingsRecords.filter(i1 => filteredSettings.find(i2 => i1.id === i2._id));
			// Create
			const settingsToCreateMapped = settingsToCreate.map(setting =>
				settingsCollection.prepareCreate(
					protectedFunction((s: any) => {
						s._raw = sanitizedRaw({ id: setting._id }, settingsCollection.schema);
						Object.assign(s, setting);
					})
				)
			);

			// Update
			const settingsToUpdateMapped = settingsToUpdate.map(setting => {
				const newSetting = filteredSettings.find(s => s._id === setting.id);
				return setting.prepareUpdate(
					protectedFunction((s: any) => {
						Object.assign(s, newSetting);
					})
				);
			});

			const allRecords = [...settingsToCreateMapped, ...settingsToUpdateMapped];

			try {
				await db.batch(allRecords);
			} catch (e) {
				log(e);
			}
			return allRecords.length;
		});
	} catch (e) {
		log(e);
	}
}
