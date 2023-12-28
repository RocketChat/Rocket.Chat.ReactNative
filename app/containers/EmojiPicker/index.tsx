import React, { useState } from 'react';
import { View } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';

import { ICustomEmojis, IEmoji } from '../../definitions';
import { categories, emojisByCategory } from '../../lib/constants';
import { useAppSelector, useFrequentlyUsedEmoji } from '../../lib/hooks';
import { addFrequentlyUsed } from '../../lib/methods';
import { useTheme } from '../../theme';
import EmojiCategory from './EmojiCategory';
import Footer from './Footer';
import TabBar from './TabBar';
import { EventTypes, IEmojiPickerProps } from './interfaces';
import styles from './styles';

const EmojiPicker = ({
	onItemClicked,
	isEmojiKeyboard = false,
	searching = false,
	searchedEmojis = []
}: IEmojiPickerProps): React.ReactElement | null => {
	const { colors } = useTheme();
	const [parentWidth, setParentWidth] = useState(0);

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

	const handleEmojiSelect = (emoji: IEmoji) => {
		onItemClicked(EventTypes.EMOJI_PRESSED, emoji);
		addFrequentlyUsed(emoji);
	};

	const renderCategory = (category: keyof typeof emojisByCategory, i: number, label: string) => {
		let emojis = [];
		if (i === 0) {
			emojis = frequentlyUsed;
		} else if (i === 1) {
			emojis = customEmojis;
		} else {
			emojis = emojisByCategory[category];
		}
		if (!emojis.length) {
			return null;
		}
		return (
			<EmojiCategory
				key={category}
				parentWidth={parentWidth}
				emojis={emojis}
				onEmojiSelected={(emoji: IEmoji) => handleEmojiSelect(emoji)}
				tabLabel={label}
			/>
		);
	};

	if (!loaded) {
		return null;
	}

	return (
		<View style={styles.emojiPickerContainer} onLayout={e => setParentWidth(e.nativeEvent.layout.width)}>
			{searching ? (
				<EmojiCategory
					emojis={searchedEmojis}
					onEmojiSelected={(emoji: IEmoji) => handleEmojiSelect(emoji)}
					parentWidth={parentWidth}
				/>
			) : (
				<ScrollableTabView
					renderTabBar={() => <TabBar />}
					contentProps={{
						keyboardShouldPersistTaps: 'always',
						keyboardDismissMode: 'none'
					}}
					style={{ backgroundColor: colors.messageboxBackground }}
				>
					{categories.tabs.map((tab: any, i) => renderCategory(tab.category, i, tab.tabLabel))}
				</ScrollableTabView>
			)}
			{isEmojiKeyboard && (
				<Footer
					onSearchPressed={() => onItemClicked(EventTypes.SEARCH_PRESSED)}
					onBackspacePressed={() => onItemClicked(EventTypes.BACKSPACE_PRESSED)}
				/>
			)}
		</View>
	);
};

export default EmojiPicker;
