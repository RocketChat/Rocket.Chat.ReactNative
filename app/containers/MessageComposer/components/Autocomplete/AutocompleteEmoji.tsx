import { View, Text } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { IAutocompleteEmoji } from '../../interfaces';
import { Emoji } from '../../../EmojiPicker/Emoji';

export const AutocompleteEmoji = ({ item }: { item: IAutocompleteEmoji }) => {
	const { colors } = useTheme();
	return (
		<>
			<Emoji emoji={item.emoji} />
			<View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
				<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
					<Text style={[sharedStyles.textBold, { fontSize: 14, color: colors.fontDefault }]} numberOfLines={1}>
						{typeof item.emoji === 'string' ? `:${item.emoji}:` : `:${item.emoji.name}:`}
					</Text>
				</View>
			</View>
		</>
	);
};
