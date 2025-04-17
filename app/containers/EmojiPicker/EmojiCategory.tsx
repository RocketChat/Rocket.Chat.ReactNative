import React, { memo, useEffect } from 'react';
import { FlatList } from 'react-native';

import { ICustomEmojis, IEmoji } from '../../definitions/IEmoji';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { PressableEmoji } from './PressableEmoji';
import { EMOJI_BUTTON_SIZE } from './styles';
import { categories, emojisByCategory } from '../../lib/constants';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useFrequentlyUsedEmoji } from '../../lib/hooks/useFrequentlyUsedEmoji';

interface IEmojiCategoryProps {
	onEmojiSelected: (emoji: IEmoji) => void;
	tabLabel?: string; // needed for react-native-scrollable-tab-view only
	parentWidth: number;
	category: (typeof categories.list)[number];
}

const useEmojis = (category: IEmojiCategoryProps['category']) => {
	const { frequentlyUsed, loaded } = useFrequentlyUsedEmoji();
	const allCustomEmojis: ICustomEmojis = useAppSelector(
		state => state.customEmojis,
		() => true
	);
	const customEmojis = Object.keys(allCustomEmojis)
		.filter(item => item === allCustomEmojis[item].name)
		.map(item => ({
			name: allCustomEmojis[item].name,
			extension: allCustomEmojis[item].extension
		}));

	if (!loaded) {
		return [];
	}
	if (category === 'frequentlyUsed') {
		return frequentlyUsed;
	}
	if (category === 'custom') {
		return customEmojis;
	}
	return emojisByCategory[category];
};

const EmojiCategory = ({ parentWidth, category, onEmojiSelected }: IEmojiCategoryProps): React.ReactElement | null => {
	console.count(`EmojiCategory ${category}`);
	const emojis = useEmojis(category);
	console.log('emojis', emojis);
	useEffect(() => () => console.countReset(`EmojiCategory ${category}`), []);
	if (!parentWidth) {
		return null;
	}

	const numColumns = Math.trunc(parentWidth / EMOJI_BUTTON_SIZE);
	const marginHorizontal = (parentWidth % EMOJI_BUTTON_SIZE) / 2;

	const renderItem = ({ item }: { item: IEmoji }) => <PressableEmoji emoji={item} onPress={onEmojiSelected} />;

	return (
		<FlatList
			key={`emoji-category-${parentWidth}`}
			keyExtractor={item => (typeof item === 'string' ? item : item.name)}
			data={emojis}
			renderItem={renderItem}
			numColumns={numColumns}
			// initialNumToRender={45}
			// removeClippedSubviews
			contentContainerStyle={{ marginHorizontal }}
			{...scrollPersistTaps}
			keyboardDismissMode={'none'}
		/>
	);
};

export default memo(EmojiCategory);
