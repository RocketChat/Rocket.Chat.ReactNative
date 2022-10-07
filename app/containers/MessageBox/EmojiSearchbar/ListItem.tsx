import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';

import { IEmoji } from '../../../definitions';
import { Emoji } from './Emoji';

interface IListItem {
	emoji: IEmoji;
	onEmojiSelected: (emoji: IEmoji) => void;
}

const styles = StyleSheet.create({
	emojiContainer: {
		justifyContent: 'center',
		marginHorizontal: 2
	}
});

export const ListItem = ({ emoji, onEmojiSelected }: IListItem): React.ReactElement => {
	const key = typeof emoji === 'string' ? emoji : emoji?.name || emoji?.content;
	return (
		<View style={styles.emojiContainer} key={key} testID={`searched-emoji-${key}`}>
			<Pressable onPress={() => onEmojiSelected(emoji)}>
				<Emoji emoji={emoji} />
			</Pressable>
		</View>
	);
};
