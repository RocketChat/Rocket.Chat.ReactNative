import { View } from 'react-native';
import { PlainText } from 'react-native-plain-text';

import { type IAutocompleteEmoji } from '~/containers/MessageComposer/interfaces';
import { Emoji } from '~/containers/EmojiPicker/Emoji';
import { useStyle } from './styles';

export const AutocompleteEmoji = ({ item }: { item: IAutocompleteEmoji }) => {
	const [styles] = useStyle();
	return (
		<>
			<Emoji emoji={item.emoji} />
			<View style={styles.emoji}>
				<View style={styles.emojiTitle}>
					<PlainText style={styles.emojiText} numberOfLines={1}>
						{typeof item.emoji === 'string' ? `:${item.emoji}:` : `:${item.emoji.name}:`}
					</PlainText>
				</View>
			</View>
		</>
	);
};
