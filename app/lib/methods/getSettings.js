import { InteractionManager } from 'react-native';

import reduxStore from '../createStore';
// import { get } from './helpers/rest';
import database from '../realm';
import * as actions from '../../actions';
import log from '../../utils/log';
import { settingsUpdatedAt } from '../../constants/settings';

const getLastUpdate = () => {
	const [setting] = database.objects('settings').sorted('_updatedAt', true);
	return setting && setting._updatedAt;
};

function updateServer(param) {
	database.databases.serversDB.write(() => {
		database.databases.serversDB.create('servers', { id: this.ddp.url, ...param }, true);
	});
}

export default async function() {
	try {
		if (!this.ddp) {
			// TODO: should implement loop or get from rest?
			return;
		}

		const lastUpdate = getLastUpdate();
		const fetchNewSettings = lastUpdate < settingsUpdatedAt;
		const result = await ((!lastUpdate || fetchNewSettings) ? this.ddp.call('public-settings/get') : this.ddp.call('public-settings/get', new Date(lastUpdate)));
		const data = result.update || result || [];

		const filteredSettings = this._prepareSettings(this._filterSettings(data));

		InteractionManager.runAfterInteractions(
			() => database.write(
				() => filteredSettings.forEach((setting) => {
					database.create('settings', { ...setting, _updatedAt: new Date() }, true);

					if (setting._id === 'Site_Name') {
						updateServer.call(this, { name: setting.valueAsString });
					}
				})
			)
		);
		reduxStore.dispatch(actions.addSettings(this.parseSettings(filteredSettings)));

		const iconSetting = data.find(item => item._id === 'Assets_favicon_512');
		if (iconSetting) {
			const iconURL = `${ this.ddp.url }/${ iconSetting.value.url || iconSetting.value.defaultUrl }`;
			updateServer.call(this, { iconURL });
		}
	} catch (e) {
		log('getSettings', e);
	}
}
