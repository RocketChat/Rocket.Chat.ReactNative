import React from 'react';
import { Text, Pressable } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import styles from './styles';
import CustomEmoji from './CustomEmoji';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { IEmoji, IEmojiCategory } from '../../definitions/IEmoji';
import { useTheme } from '../../theme';
import { isIOS } from '../../lib/methods/helpers';

const MAX_EMOJI_SIZE = 50;

interface IEmojiProps {
	emoji: string | IEmoji;
	size: number;
	baseUrl: string;
}

const Emoji = React.memo(({ emoji, size, baseUrl }: IEmojiProps) => {
	if (typeof emoji === 'string')
		return (
			<Text style={[styles.categoryEmoji, { height: size, width: size, fontSize: size - 14 }]}>
				{shortnameToUnicode(`:${emoji}:`)}
			</Text>
		);
	return (
		<CustomEmoji style={[styles.customCategoryEmoji, { height: size - 16, width: size - 16 }]} emoji={emoji} baseUrl={baseUrl} />
	);
});

const EmojiCategory = ({ baseUrl, onEmojiSelected, emojis, width, tabsCount }: IEmojiCategory): React.ReactElement | null => {
	const emojiSize = width ? Math.min(width / tabsCount, MAX_EMOJI_SIZE) : MAX_EMOJI_SIZE;
	const numColumns = Math.trunc(width ? width / emojiSize : tabsCount);
	const { colors } = useTheme();

	const renderItem = (emoji: IEmoji | string) => (
		<Pressable
			key={typeof emoji === 'string' ? emoji : emoji.content}
			onPress={() => onEmojiSelected(emoji)}
			testID={`emoji-${typeof emoji === 'string' ? emoji : emoji.content}`}
			android_ripple={{ color: colors.bannerBackground, borderless: true, radius: emojiSize / 2 }}
			style={({ pressed }: { pressed: boolean }) => ({
				backgroundColor: isIOS && pressed ? colors.bannerBackground : 'transparent'
			})}
		>
			<Emoji emoji={emoji} size={emojiSize} baseUrl={baseUrl} />
		</Pressable>
	);

	if (!width) {
		return null;
	}

	return (
		<FlatList
			// rerender FlatList in case of width changes
			key={`emoji-category-${width}`}
			// @ts-ignore
			keyExtractor={item => (item?.isCustom && item.content) || item}
			data={emojis}
			extraData={{ baseUrl, width }}
			renderItem={({ item }) => renderItem(item)}
			numColumns={numColumns}
			initialNumToRender={45}
			removeClippedSubviews
			{...scrollPersistTaps}
			keyboardDismissMode={'none'}
		/>
	);
};

export default EmojiCategory;
