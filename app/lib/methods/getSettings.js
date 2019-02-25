import { InteractionManager } from 'react-native';

import reduxStore from '../createStore';
import database from '../realm';
import * as actions from '../../actions';
import log from '../../utils/log';
import settings from '../../constants/settings';

function updateServer(param) {
	database.databases.serversDB.write(() => {
		try {
			database.databases.serversDB.create('servers', { id: reduxStore.getState().server.server, ...param }, true);
		} catch (e) {
			log('updateServer', e);
		}
	});
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

		InteractionManager.runAfterInteractions(
			() => database.write(
				() => filteredSettings.forEach((setting) => {
					try {
						database.create('settings', { ...setting, _updatedAt: new Date() }, true);
					} catch (e) {
						log('create settings', e);
					}

					if (setting._id === 'Site_Name') {
						updateServer.call(this, { name: setting.valueAsString });
					}
				})
			)
		);
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
