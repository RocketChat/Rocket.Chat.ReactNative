import React from 'react';
import { FlatList } from 'react-native-gesture-handler';

import { IEmoji } from '../../definitions/IEmoji';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { PressableEmoji } from './PressableEmoji';
import { EMOJI_BUTTON_SIZE } from './styles';

interface IEmojiCategoryProps {
	emojis: IEmoji[];
	onEmojiSelected: (emoji: IEmoji) => void;
	tabLabel?: string; // needed for react-native-scrollable-tab-view only
	parentWidth: number;
}

const EmojiCategory = ({ onEmojiSelected, emojis, parentWidth }: IEmojiCategoryProps): React.ReactElement | null => {
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
			initialNumToRender={45}
			removeClippedSubviews
			contentContainerStyle={{ marginHorizontal }}
			{...scrollPersistTaps}
			keyboardDismissMode={'none'}
		/>
	);
};

export default EmojiCategory;
