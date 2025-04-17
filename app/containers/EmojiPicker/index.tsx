import React, { useCallback, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';

import EmojiCategory from './EmojiCategory';
import Footer from './Footer';
import styles from './styles';
import { categories } from '../../lib/constants';
import { useTheme } from '../../theme';
import { IEmoji } from '../../definitions';
import { addFrequentlyUsed } from '../../lib/methods';
import { IEmojiPickerProps, EventTypes } from './interfaces';
import { CustomIcon } from '../CustomIcon';

const routes = categories.tabs.map((tab: any) => ({
	key: tab.category,
	title: tab.tabLabel
}));

const EmojiPicker = ({
	onItemClicked,
	isEmojiKeyboard = false,
	searching = false,
	searchedEmojis = []
}: IEmojiPickerProps): React.ReactElement | null => {
	const layout = useWindowDimensions();
	const [index, setIndex] = React.useState(0);
	const { colors } = useTheme();
	const [parentWidth, setParentWidth] = useState(0);

	const handleEmojiSelect = useCallback(
		(emoji: IEmoji) => {
			onItemClicked(EventTypes.EMOJI_PRESSED, emoji);
			addFrequentlyUsed(emoji);
		},
		[onItemClicked]
	);

	const renderScene = ({ route }: { route: any }) => (
		<EmojiCategory parentWidth={parentWidth} onEmojiSelected={(emoji: IEmoji) => handleEmojiSelect(emoji)} category={route.key} />
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
				<TabView
					commonOptions={{
						icon: ({ route, focused }) => (
							<CustomIcon size={24} name={route.title} color={focused ? colors.strokeHighlight : colors.fontSecondaryInfo} />
						),
						labelText: ''
					}}
					renderTabBar={props => (
						<TabBar
							{...props}
							style={{ backgroundColor: colors.surfaceLight }}
							tabStyle={{ padding: 0 }}
							activeColor={colors.strokeHighlight}
							inactiveColor={colors.strokeExtraLight}
							indicatorStyle={{ backgroundColor: colors.strokeHighlight }}
						/>
					)}
					style={{ backgroundColor: colors.surfaceLight }}
					navigationState={{ index, routes }}
					renderScene={renderScene}
					onIndexChange={setIndex}
					initialLayout={{ width: layout.width }}
					lazy
				/>
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
