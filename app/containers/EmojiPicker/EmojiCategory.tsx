import React, { memo } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type ICustomEmojis, type IEmoji } from '../../definitions/IEmoji';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { PressableEmoji } from './PressableEmoji';
import { EMOJI_BUTTON_SIZE } from './styles';
import { emojisByCategory } from '../../lib/constants/emojis';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useFrequentlyUsedEmoji } from '../../lib/hooks/useFrequentlyUsedEmoji';
import { type IEmojiCategoryProps, type TEmojiCategory } from './interfaces';

const EMOJI_CATEGORY_BOTTOM_SHEET_PADDING = EMOJI_BUTTON_SIZE + 22;

const useEmojis = (category?: TEmojiCategory) => {
	const { frequentlyUsed, loaded } = useFrequentlyUsedEmoji();
	const allCustomEmojis: ICustomEmojis = useAppSelector(
		state => state.customEmojis,
		() => true
	);
	if (!category) {
		return [];
	}
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

const EmojiCategory = ({
	parentWidth,
	category,
	emojis,
	onEmojiSelected,
	bottomSheet = false
}: IEmojiCategoryProps): React.ReactElement | null => {
	const items = useEmojis(category);
	const { bottom } = useSafeAreaInsets();

	if (!parentWidth) {
		return null;
	}

	const numColumns = Math.trunc(parentWidth / EMOJI_BUTTON_SIZE);
	const marginHorizontal = (parentWidth % EMOJI_BUTTON_SIZE) / 2;
	const contentPaddingBottom = bottomSheet ? bottom + EMOJI_CATEGORY_BOTTOM_SHEET_PADDING : undefined;

	const renderItem = ({ item }: { item: IEmoji }) => <PressableEmoji emoji={item} onPress={onEmojiSelected} />;

	return (
		<FlatList
			key={`emoji-category-${parentWidth}`}
			keyExtractor={item => (typeof item === 'string' ? item : item.name)}
			data={emojis || items}
			renderItem={renderItem}
			numColumns={numColumns}
			contentContainerStyle={{
				marginHorizontal,
				...(contentPaddingBottom != null && { paddingBottom: contentPaddingBottom })
			}}
			{...scrollPersistTaps}
			keyboardDismissMode='none'
			nestedScrollEnabled
		/>
	);
};

export default memo(EmojiCategory);
