import React from 'react';
import { View, Text } from 'react-native';

import { IAutocompleteEmoji } from '../../interfaces';
import { Emoji } from '../../../EmojiPicker/Emoji';
import { useStyle } from './styles';

export const AutocompleteEmoji = ({ item }: { item: IAutocompleteEmoji }) => {
	const [styles] = useStyle();
	return (
		<>
			<Emoji emoji={item.emoji} />
			<View style={styles.emoji}>
				<View style={styles.emojiTitle}>
					<Text style={styles.emojiText} numberOfLines={1}>
						{typeof item.emoji === 'string' ? `:${item.emoji}:` : `:${item.emoji.name}:`}
					</Text>
				</View>
			</View>
		</>
	);
};
