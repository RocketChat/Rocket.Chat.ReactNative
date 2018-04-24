import { InteractionManager } from 'react-native';
import reduxStore from '../createStore';
// import { get } from './helpers/rest';

import database from '../realm';
import * as actions from '../../actions';

const getLastMessage = () => {
	const setting = database.objects('permissions').sorted('_updatedAt', true)[0];
	return setting && setting._updatedAt;
};


export default async function() {
	const lastMessage = getLastMessage();
	const result = await (!lastMessage ? this.ddp.call('permissions/get') : this.ddp.call('permissions/get', new Date(lastMessage)));
	const permissions = this._preparePermissions(result.update || result);
	console.log('getPermissions', permissions);
	InteractionManager.runAfterInteractions(() => database.write(() =>
		permissions.forEach(permission => database.create('permissions', permission, true))));
	reduxStore.dispatch(actions.setAllPermissions(this.parsePermissions(permissions)));
}
