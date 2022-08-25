import React, { useMemo } from 'react';
import { View } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import { shallowEqual } from 'react-redux';

import TabBar from './TabBar';
import EmojiCategory from './EmojiCategory';
import Footer from './Footer';
import styles from './styles';
import categories from './categories';
import { emojisByCategory } from './emojis';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import log from '../../lib/methods/helpers/log';
import { useTheme } from '../../theme';
import { IEmoji, ICustomEmojis } from '../../definitions';
import { useAppSelector } from '../../lib/hooks';
import { IEmojiPickerProps, EventTypes } from './interfaces';
import { useFrequentlyUsedEmoji, addFrequentlyUsed } from './frequentlyUsedEmojis';

const EmojiPicker = ({
	onItemClicked,
	tabEmojiStyle,
	isEmojiKeyboard = false,
	searching = false,
	searchedEmojis = []
}: IEmojiPickerProps): React.ReactElement | null => {
	const { colors } = useTheme();
	const { frequentlyUsed, loaded } = useFrequentlyUsedEmoji();

	const baseUrl = useAppSelector(state => state.server?.server);
	const allCustomEmojis: ICustomEmojis = useAppSelector(state => state.customEmojis, shallowEqual);
	const customEmojis = useMemo(
		() =>
			Object.keys(allCustomEmojis)
				.filter(item => item === allCustomEmojis[item].name)
				.map(item => ({
					content: allCustomEmojis[item].name,
					name: allCustomEmojis[item].name,
					extension: allCustomEmojis[item].extension,
					isCustom: true
				})),
		[allCustomEmojis]
	);

	const handleEmojiSelect = (emoji: IEmoji | string) => {
		try {
			if (typeof emoji === 'string') {
				addFrequentlyUsed({ content: emoji, name: emoji, isCustom: false });
				const shortname = `:${emoji}:`;
				onItemClicked(EventTypes.EMOJI_PRESSED, shortnameToUnicode(shortname), shortname);
			} else {
				addFrequentlyUsed({
					content: emoji.content,
					name: emoji.name,
					extension: emoji.extension,
					isCustom: true
				});
				onItemClicked(EventTypes.EMOJI_PRESSED, `:${emoji.content}:`);
			}
		} catch (e) {
			log(e);
		}
	};

	const renderCategory = (category: keyof typeof emojisByCategory, i: number, label: string, tabsCount: number) => {
		let emojis = [];
		if (i === 0) {
			emojis = frequentlyUsed;
		} else if (i === 1) {
			emojis = customEmojis;
		} else {
			emojis = emojisByCategory[category];
		}
		return (
			<EmojiCategory
				emojis={emojis}
				onEmojiSelected={(emoji: IEmoji | string) => handleEmojiSelect(emoji)}
				style={styles.categoryContainer}
				baseUrl={baseUrl}
				tabLabel={label}
				tabsCount={tabsCount}
			/>
		);
	};

	if (!loaded) {
		return null;
	}

	const tabsCount = frequentlyUsed.length === 0 ? categories.tabs.length - 1 : categories.tabs.length;

	return (
		<View style={styles.emojiPickerContainer}>
			{searching ? (
				<EmojiCategory
					emojis={searchedEmojis}
					onEmojiSelected={(emoji: IEmoji | string) => handleEmojiSelect(emoji)}
					style={styles.categoryContainer}
					baseUrl={baseUrl}
					tabLabel={'searching'}
					tabsCount={tabsCount}
				/>
			) : (
				<ScrollableTabView
					renderTabBar={() => <TabBar tabEmojiStyle={tabEmojiStyle} />}
					contentProps={{
						keyboardShouldPersistTaps: 'always',
						keyboardDismissMode: 'none'
					}}
					style={{ backgroundColor: colors.focusedBackground }}
				>
					{categories.tabs.map((tab: any, i) =>
						i === 0 && frequentlyUsed.length === 0
							? null // when no frequentlyUsed don't show the tab
							: renderCategory(tab.category, i, tab.tabLabel, tabsCount)
					)}
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
