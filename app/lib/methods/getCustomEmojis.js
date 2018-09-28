import { InteractionManager } from 'react-native';

import reduxStore from '../createStore';
// import { get } from './helpers/rest';

import database from '../realm';
import * as actions from '../../actions';
import log from '../../utils/log';

const getLastMessage = () => {
	const setting = database.objects('customEmojis').sorted('_updatedAt', true)[0];
	return setting && setting._updatedAt;
};


export default async function() {
	try {
		if (!this.ddp) {
			// TODO: should implement loop or get from rest?
			return;
		}

		const lastMessage = getLastMessage();
		let emojis = await this.ddp.call('listEmojiCustom');
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
