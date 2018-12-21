import { InteractionManager } from 'react-native';
import * as SDK from '@rocket.chat/sdk';

import reduxStore from '../createStore';

import database from '../realm';
import * as actions from '../../actions';
import log from '../../utils/log';

const getLastMessage = () => {
	const setting = database.objects('customEmojis').sorted('_updatedAt', true)[0];
	return setting && setting._updatedAt;
};

// TODO: fix api (get emojis by date/version....)
export default async function() {
	try {
		const lastMessage = getLastMessage();
		// RC 0.61.0
		const result = await SDK.api.get('emoji-custom');
		let { emojis } = result;
		emojis = emojis.filter(emoji => !lastMessage || emoji._updatedAt > lastMessage);
		emojis = this._prepareEmojis(emojis);
		InteractionManager.runAfterInteractions(() => database.write(() => {
			emojis.forEach(emoji => database.create('customEmojis', emoji, true));
		}));
		reduxStore.dispatch(actions.setCustomEmojis(this.parseEmojis(emojis)));
	} catch (e) {
		log('getCustomEmojis', e);
	}
}
