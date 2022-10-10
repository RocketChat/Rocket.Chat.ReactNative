import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Q } from '@nozbe/watermelondb';

import EmojiPicker from '../../containers/EmojiPicker';
import styles from './styles';
import { IEmoji } from '../../definitions';
import { EventTypes } from '../../containers/EmojiPicker/interfaces';
import { sanitizeLikeString } from '../../lib/database/utils';
import { emojis } from '../../containers/EmojiPicker/data';
import database from '../../lib/database';
import { debounce } from '../../lib/methods/helpers/debounce';
import { EmojiSearch } from '../../containers/EmojiPicker/EmojiSearch';

interface IReactionPickerProps {
	message?: any;
	show: boolean;
	reactionClose: () => void;
	onEmojiSelected: (shortname: string, id: string) => void;
	width: number;
	height: number;
}

const MAX_EMOJIS_TO_DISPLAY = 20;

const ReactionPicker = ({ onEmojiSelected, message, reactionClose }: IReactionPickerProps): React.ReactElement => {
	const [searchedEmojis, setSearchedEmojis] = React.useState<IEmoji[]>([]);
	const [searching, setSearching] = React.useState<boolean>(false);

	const handleTextChange = (text: string) => {
		setSearching(text !== '');
		searchEmojis(text);
	};

	const searchEmojis = useCallback(
		debounce(async (keyword: string) => {
			const likeString = sanitizeLikeString(keyword);
			const whereClause = [];
			if (likeString) {
				whereClause.push(Q.where('name', Q.like(`${likeString}%`)));
			}
			const db = database.active;
			const customEmojisCollection = await (
				await db
					.get('custom_emojis')
					.query(...whereClause)
					.fetch()
			).slice(0, MAX_EMOJIS_TO_DISPLAY / 2);
			const customEmojis = customEmojisCollection?.map(emoji => ({
				isCustom: true,
				content: emoji?.name,
				name: emoji?.name,
				extension: emoji?.extension
			})) as IEmoji[];
			const filteredEmojis = emojis.filter(emoji => emoji.indexOf(keyword) !== -1).slice(0, MAX_EMOJIS_TO_DISPLAY / 2);
			const mergedEmojis = [...customEmojis, ...filteredEmojis];
			setSearchedEmojis(mergedEmojis);
		}, 300),
		[]
	);

	const handleEmojiSelect = (_eventType: EventTypes, emoji?: string, shortname?: string) => {
		// standard emojis: `emoji` is unicode and `shortname` is :joy:
		// custom emojis: only `emoji` is returned with shortname type (:joy:)
		// to set reactions, we need shortname type
		if (message) {
			// @ts-ignore
			onEmojiSelected(shortname || emoji, message.id);
		}
		reactionClose();
	};

	return (
		<View style={styles.reactionPickerContainer} testID='reaction-picker'>
			<View style={styles.reactionSearchContainer}>
				<EmojiSearch onChangeText={handleTextChange} />
			</View>
			<EmojiPicker onItemClicked={handleEmojiSelect} searching={searching} searchedEmojis={searchedEmojis} />
		</View>
	);
};

export default ReactionPicker;
