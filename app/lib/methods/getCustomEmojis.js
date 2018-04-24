import { InteractionManager } from 'react-native';
import reduxStore from '../createStore';
// import { get } from './helpers/rest';

import database from '../realm';
import * as actions from '../../actions';

const getLastMessage = () => {
	const setting = database.objects('customEmojis').sorted('_updatedAt', true)[0];
	return setting && setting._updatedAt;
};


export default async function() {
	const lastMessage = getLastMessage();
	let emojis = await this.ddp.call('listEmojiCustom');
	emojis = emojis.filter(emoji => !lastMessage || emoji._updatedAt > lastMessage);
	emojis = this._prepareEmojis(emojis);
	InteractionManager.runAfterInteractions(() => database.write(() => {
		emojis.forEach(emoji => database.create('customEmojis', emoji, true));
	}));
	reduxStore.dispatch(actions.setCustomEmojis(this.parseEmojis(emojis)));
}
