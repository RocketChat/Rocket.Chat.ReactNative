import { InteractionManager } from 'react-native';

import reduxStore from '../createStore';
import * as actions from '../../actions';
import log from '../../utils/log';
import settings from '../../constants/settings';
import watermelon from '../database';
import update	 from '../../utils/update';

export default async function() {
	try {
		const { serversDB } = watermelon.databases;
		const serverId = reduxStore.getState().server.server;
		const settingsParams = JSON.stringify(Object.keys(settings));
		// RC 0.60.0
		const result = await fetch(`${ this.sdk.client.host }/api/v1/settings.public?query={"_id":{"$in":${ settingsParams }}}`).then(response => response.json());

		if (!result.success) {
			return;
		}
		const data = result.settings || [];
		const filteredSettings = this._prepareSettings(data.filter(item => item._id !== 'Assets_favicon_512'));

		InteractionManager.runAfterInteractions(
			() => filteredSettings.forEach(async(setting) => {
				try {
					await update(watermelon.database, 'settings', { ...setting, _updatedAt: new Date(), id: setting._id });

					if (setting._id === 'Site_Name') {
						await update(serversDB, 'servers', { id: serverId, name: setting.valueAsString });
					}
					if (setting._id === 'UI_Use_Real_Name') {
						await update(serversDB, 'servers', { id: serverId, useRealName: setting.valueAsBoolean });
					}
					if (setting._id === 'FileUpload_MediaTypeWhiteList') {
						await update(serversDB, 'servers', { id: serverId, FileUpload_MediaTypeWhiteList: setting.valueAsString });
					}
					if (setting._id === 'FileUpload_MaxFileSize') {
						await update(serversDB, 'servers', { id: serverId, FileUpload_MaxFileSize: setting.valueAsNumber });
					}
				} catch (e) {
					log(e);
				}
			})
		);
		reduxStore.dispatch(actions.addSettings(this.parseSettings(filteredSettings)));

		const iconSetting = data.find(item => item._id === 'Assets_favicon_512');
		if (iconSetting) {
			const baseUrl = reduxStore.getState().server.server;
			const iconURL = `${ baseUrl }/${ iconSetting.value.url || iconSetting.value.defaultUrl }`;
			await update(serversDB, 'servers', { id: serverId, iconURL });
		}
	} catch (e) {
		log(e);
	}
}
