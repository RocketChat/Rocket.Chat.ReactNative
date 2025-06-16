import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Route } from 'reanimated-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmojiCategory from './EmojiCategory';
import Footer from './Footer';
import styles from './styles';
import { categories } from '../../lib/constants';
import { IEmoji } from '../../definitions';
import { addFrequentlyUsed } from '../../lib/methods';
import { IEmojiPickerProps, EventTypes } from './interfaces';
import { CustomIcon, TIconsName } from '../CustomIcon';
import { TabView } from '../TabView';
import { useTheme } from '../../theme';
import { EmojiPickerProvider, useEmojiPicker } from './EmojiPickerContext';

const routes = categories.tabs.map(tab => ({
	key: tab.category,
	title: tab.tabLabel
}));

const EmojiPickerContent = ({
	onItemClicked,
	isEmojiKeyboard = false,
	searching = false,
	searchedEmojis = []
}: IEmojiPickerProps): React.ReactElement | null => {
	const { bottom } = useSafeAreaInsets();
	const { colors } = useTheme();
	const { setParentWidth } = useEmojiPicker();

	const handleEmojiSelect = useCallback(
		(emoji: IEmoji) => {
			onItemClicked(EventTypes.EMOJI_PRESSED, emoji);
			addFrequentlyUsed(emoji);
		},
		[onItemClicked]
	);

	const renderScene = ({ route }: { route: Route }) => (
		<EmojiCategory onEmojiSelected={handleEmojiSelect} category={route.key as any} />
	);

	const renderTabItem = (tab: Route, color: string) => (
		<CustomIcon
			size={24}
			name={tab.title as TIconsName}
			color={color}
			style={styles.tabEmoji}
			testID={`emoji-picker-tab-${tab.title}`}
		/>
	);

	return (
		<View
			style={[styles.emojiPickerContainer, { marginBottom: bottom, backgroundColor: colors.surfaceLight }]}
			onLayout={e => {
				setParentWidth(e.nativeEvent.layout.width);
			}}>
			{searching ? (
				<EmojiCategory emojis={searchedEmojis} onEmojiSelected={(emoji: IEmoji) => handleEmojiSelect(emoji)} />
			) : (
				<TabView renderScene={renderScene} renderTabItem={renderTabItem} routes={routes} />
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

const EmojiPicker = (props: IEmojiPickerProps): React.ReactElement | null => (
	<EmojiPickerProvider>
		<EmojiPickerContent {...props} />
	</EmojiPickerProvider>
);

export default EmojiPicker;
