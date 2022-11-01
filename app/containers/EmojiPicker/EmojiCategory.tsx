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

	const renderItem = ({ item }: { item: IEmoji }) => <PressableEmoji emoji={item} onPress={onEmojiSelected} />;

	if (!width) {
		return null;
	}

	return (
		<FlatList
			// needed to update the numColumns when the width changes
			key={`emoji-category-${width}`}
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
