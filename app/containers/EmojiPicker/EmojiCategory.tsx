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
	windowWidth: number;
}

const EmojiCategory = ({ onEmojiSelected, emojis, windowWidth }: IEmojiCategoryProps): React.ReactElement | null => {
	const numColumns = windowWidth / EMOJI_BUTTON_SIZE;
	const canBeRound = numColumns % 1 > 0.75; // pixel logic
	const fixedColumnsNum = canBeRound ? Math.round(numColumns) : Math.trunc(numColumns);

	const renderItem = ({ item }: { item: IEmoji }) => <PressableEmoji emoji={item} onPress={onEmojiSelected} />;

	if (!windowWidth) {
		return null;
	}

	return (
		<FlatList
			key={`emoji-category-${windowWidth}`}
			keyExtractor={item => (typeof item === 'string' ? item : item.name)}
			data={emojis}
			renderItem={renderItem}
			numColumns={fixedColumnsNum}
			initialNumToRender={45}
			removeClippedSubviews
			{...scrollPersistTaps}
			keyboardDismissMode={'none'}
			contentContainerStyle={{ alignItems: 'center' }}
		/>
	);
};

export default EmojiCategory;
