import React from 'react';
import { View, Pressable } from 'react-native';

import { IEmoji } from '../../../definitions';
import styles from '../styles';
import { addFrequentlyUsed } from '../../EmojiPicker/frequentlyUsedEmojis';
import { Emoji } from './Emoji';

interface IListItem {
	emoji: IEmoji;
	onEmojiSelected: (emoji: IEmoji) => void;
}

export const ListItem = ({ emoji, onEmojiSelected }: IListItem): React.ReactElement => {
	const key = typeof emoji === 'string' ? emoji : emoji?.name || emoji?.content;
	const onPress = () => {
		onEmojiSelected(emoji);
		if (typeof emoji === 'string') {
			addFrequentlyUsed({ content: emoji, name: emoji, isCustom: false });
		} else {
			addFrequentlyUsed({
				content: emoji?.content || emoji?.name,
				name: emoji?.name,
				extension: emoji.extension,
				isCustom: true
			});
		}
	};
	return (
		<View style={styles.emojiContainer} key={key} testID={`searched-emoji-${key}`}>
			<Pressable onPress={onPress}>
				<Emoji emoji={emoji} />
			</Pressable>
		</View>
	);
};
