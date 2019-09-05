import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import reduxStore from '../createStore';
// import * as actions from '../../actions';
import settings from '../../constants/settings';
import log from '../../utils/log';
import watermelondb from '../database';
import protectedFunction from './helpers/protectedFunction';

const serverInfoKeys = ['Site_Name', 'UI_Use_Real_Name', 'FileUpload_MediaTypeWhiteList', 'FileUpload_MaxFileSize'];

const serverInfoUpdate = (serverInfo, iconSetting) => {
	const { serversDB } = watermelondb.databases;
	const serverId = reduxStore.getState().server.server;

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
		return allSettings;
	}, {});

	if (iconSetting) {
		const iconURL = `${ serverId }/${ iconSetting.value.url || iconSetting.value.defaultUrl }`;
		info = { ...info, iconURL };
	}

	serversDB.action(async() => {
		try {
			const serversCollection = serversDB.collections.get('servers');
			const server = await serversCollection.find(serverId);

			await server.update((record) => {
				Object.assign(record, info);
			});
		} catch (e) {
			log(e);
		}
	});
};

export default async function() {
	try {
		const watermelon = watermelondb.database;
		const settingsParams = JSON.stringify(Object.keys(settings));
		// RC 0.60.0
		const result = await fetch(`${ this.sdk.client.host }/api/v1/settings.public?query={"_id":{"$in":${ settingsParams }}}`).then(response => response.json());

		if (!result.success) {
			return;
		}
		const data = result.settings || [];
		const filteredSettings = this._prepareSettings(data.filter(item => item._id !== 'Assets_favicon_512'));

		watermelon.action(async() => {
			const settingsCollection = watermelon.collections.get('settings');
			const allSettingsRecords = await settingsCollection.query().fetch();

			// filter settings
			let settingsToCreate = filteredSettings.filter(i1 => !allSettingsRecords.find(i2 => i1._id === i2.id));
			let settingsToUpdate = allSettingsRecords.filter(i1 => filteredSettings.find(i2 => i1.id === i2._id));
			const serverInfo = filteredSettings.filter(i1 => serverInfoKeys.includes(i1._id));
			const iconSetting = data.find(item => item._id === 'Assets_favicon_512');

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

			serverInfoUpdate(serverInfo, iconSetting);

			try {
				await watermelon.batch(...allRecords);
			} catch (e) {
				log(e);
			}
			return allRecords.length;
		});
	} catch (e) {
		log(e);
	}
}
