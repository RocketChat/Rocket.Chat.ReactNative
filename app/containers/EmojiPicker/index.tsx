import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Route } from 'reanimated-tab-view';

import EmojiCategory from './EmojiCategory';
import Footer from './Footer';
import styles from './styles';
import { categories } from '../../lib/constants';
import { IEmoji } from '../../definitions';
import { addFrequentlyUsed } from '../../lib/methods';
import { IEmojiPickerProps, EventTypes } from './interfaces';
import { CustomIcon, TIconsName } from '../CustomIcon';
import { TabView } from '../TabView';

const routes = categories.tabs.map(tab => ({
	key: tab.category,
	title: tab.tabLabel
}));

const EmojiPicker = ({
	onItemClicked,
	isEmojiKeyboard = false,
	searching = false,
	searchedEmojis = []
}: IEmojiPickerProps): React.ReactElement | null => {
	const [parentWidth, setParentWidth] = useState(0);

	const handleEmojiSelect = useCallback(
		(emoji: IEmoji) => {
			onItemClicked(EventTypes.EMOJI_PRESSED, emoji);
			addFrequentlyUsed(emoji);
		},
		[onItemClicked]
	);

	const renderScene = ({ route }: { route: Route }) => (
		<EmojiCategory parentWidth={parentWidth} onEmojiSelected={handleEmojiSelect} category={route.key as any} />
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
		<View style={styles.emojiPickerContainer} onLayout={e => setParentWidth(e.nativeEvent.layout.width)}>
			{searching ? (
				<EmojiCategory
					emojis={searchedEmojis}
					onEmojiSelected={(emoji: IEmoji) => handleEmojiSelect(emoji)}
					parentWidth={parentWidth}
				/>
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
export default EmojiPicker;
