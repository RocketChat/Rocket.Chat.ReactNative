import { InteractionManager } from 'react-native';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import reduxStore from '../createStore';
// import database from '../realm';
import { serverDatabase, appDatabase } from '../database';
import * as actions from '../../actions';
import log from '../../utils/log';
import settings from '../../constants/settings';

async function updateServer(param) {
	// database.databases.serversDB.write(() => {
	// 	database.databases.serversDB.create('servers', { id: reduxStore.getState().server.server, ...param }, true);
	// });

	const currentServer = reduxStore.getState().server.server;
	const serversCollection = serverDatabase.collections.get('servers');

	try {
		await serverDatabase.action(async() => {
			const server = await serversCollection.find(currentServer);
			await server.update((s) => {
				if (param.name) {
					s.name = param.name;
				}

				if (param.iconUrl) {
					s.iconUrl = param.iconUrl;
				}
			});
		});
	} catch (error) {
		console.log('updateServer -> Server not found');
	}
}

export default async function() {
	try {
		const settingsParams = JSON.stringify(Object.keys(settings));
		// RC 0.60.0
		const result = await fetch(`${ this.sdk.client.host }/api/v1/settings.public?query={"_id":{"$in":${ settingsParams }}}`).then(response => response.json());

		if (!result.success) {
			return;
		}
		const data = result.settings || [];
		const filteredSettings = this._prepareSettings(data.filter(item => item._id !== 'Assets_favicon_512'));

		InteractionManager.runAfterInteractions(async() => {
			const records = [];
			const settingsCollection = appDatabase.collections.get('settings');
			filteredSettings.forEach((setting) => {
				records.push(serverDatabase.action(async() => {
					try {
						const settingQuery = await settingsCollection.find(setting._id);
						settingQuery.update((s) => {
							s.valueAsString = setting.valueAsString;
							s.valueAsNumber = setting.valueAsNumber;
							s.valueAsBoolean = setting.valueAsBoolean;
						});
					} catch (error) {
						await settingsCollection.create((newSetting) => {
							newSetting._raw = sanitizedRaw({
								id: setting._id,
								value_as_string: setting.valueAsString,
								value_as_number: setting.valueAsNumber,
								value_as_boolean: setting.valueAsBoolean
							}, settingsCollection.schema);
						});
					}
				}));
			});
			await Promise.all(records);
		});
		reduxStore.dispatch(actions.addSettings(this.parseSettings(filteredSettings)));

		const iconSetting = data.find(item => item._id === 'Assets_favicon_512');
		if (iconSetting) {
			const baseUrl = reduxStore.getState().server.server;
			const iconURL = `${ baseUrl }/${ iconSetting.value.url || iconSetting.value.defaultUrl }`;
			updateServer.call(this, { iconURL });
		}
	} catch (e) {
		log('getSettings', e);
	}
}
