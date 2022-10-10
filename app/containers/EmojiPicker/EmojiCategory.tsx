import React from 'react';
import { useWindowDimensions } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { EMOJI_BUTTON_SIZE } from './styles';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { IEmoji } from '../../definitions/IEmoji';
import { PressableEmoji } from './PressableEmoji';

interface IEmojiCategoryProps {
	emojis: IEmoji[];
	onEmojiSelected: (emoji: IEmoji) => void;
	tabLabel?: string; // needed for react-native-scrollable-tab-view only
}

const EmojiCategory = ({ onEmojiSelected, emojis }: IEmojiCategoryProps): React.ReactElement | null => {
	const { width } = useWindowDimensions();

	const numColumns = Math.trunc(width / EMOJI_BUTTON_SIZE);
	const marginHorizontal = (width % EMOJI_BUTTON_SIZE) / 2;

	const renderItem = (emoji: IEmoji) => <PressableEmoji emoji={emoji} onPress={onEmojiSelected} />;

	if (!width) {
		return null;
	}

	return (
		<FlatList
			// rerender FlatList in case of width changes
			key={`emoji-category-${width}`}
			keyExtractor={item => (typeof item === 'string' ? item : item.content)}
			data={emojis}
			renderItem={({ item }) => renderItem(item)}
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
