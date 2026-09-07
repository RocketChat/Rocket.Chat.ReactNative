import { memo, type ReactElement } from 'react';
import { FlatList } from 'react-native';

import { type ICustomEmojis, type IEmoji } from '../../definitions/IEmoji';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { PressableEmoji } from './PressableEmoji';
import { EMOJI_BUTTON_SIZE } from './styles';
import { emojisByCategory } from '../../lib/constants/emojis/data';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useFrequentlyUsedEmoji } from '../../lib/hooks/useFrequentlyUsedEmoji';
import { type IEmojiCategoryProps, type TEmojiCategory } from './interfaces';

// Minimum visible space below the last emoji row when the picker is rendered
// inside a bottom sheet: one emoji row + a small offset, so the last row
// clears the sheet's bottom interaction area. The container's
// `marginBottom: safeAreaBottom` already supplies part of this on devices with
// a home indicator; the FlatList only tops up whatever is missing.
const BOTTOM_SHEET_EXTRA_OFFSET = 24;
const MIN_BOTTOM_SHEET_BREATHING_ROOM = EMOJI_BUTTON_SIZE + BOTTOM_SHEET_EXTRA_OFFSET;

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
}: IEmojiCategoryProps): ReactElement | null => {
	const items = useEmojis(category);

	if (!parentWidth) {
		return null;
	}

	const numColumns = Math.trunc(parentWidth / EMOJI_BUTTON_SIZE);
	const marginHorizontal = (parentWidth % EMOJI_BUTTON_SIZE) / 2;
	const contentPaddingBottom = bottomSheet ? MIN_BOTTOM_SHEET_BREATHING_ROOM : undefined;

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
