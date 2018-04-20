import { InteractionManager } from 'react-native';
import reduxStore from '../createStore';
// import { get } from './helpers/rest';

import database from '../realm';
import * as actions from '../../actions';

const getLastMessage = () => {
	const [setting] = database.objects('settings').sorted('_updatedAt', true);
	return setting && setting._updatedAt;
};

export default async function() {
	const lastMessage = getLastMessage();
	const result = await (!lastMessage ? this.ddp.call('public-settings/get') : this.ddp.call('public-settings/get', new Date(lastMessage)));
	console.log('getSettings', lastMessage, result);

	const filteredSettings = this._prepareSettings(this._filterSettings(result.update || result));

	InteractionManager.runAfterInteractions(() =>
		database.write(() =>
			filteredSettings.forEach(setting => database.create('settings', setting, true))));
	reduxStore.dispatch(actions.addSettings(this.parseSettings(filteredSettings)));
}
