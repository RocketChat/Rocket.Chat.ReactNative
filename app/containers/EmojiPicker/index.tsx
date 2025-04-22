import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { TabView as ReanimatedTabView, type NavigationState } from 'reanimated-tab-view';
import { TouchableOpacity } from 'react-native-gesture-handler';

import EmojiCategory from './EmojiCategory';
import Footer from './Footer';
import styles from './styles';
import { categories } from '../../lib/constants';
import { useTheme } from '../../theme';
import { IEmoji } from '../../definitions';
import { addFrequentlyUsed } from '../../lib/methods';
import { IEmojiPickerProps, EventTypes } from './interfaces';
import { CustomIcon, TIconsName } from '../CustomIcon';

const routes: Tab[] = categories.tabs.map(tab => ({
	key: tab.category,
	emoji: tab.tabLabel
}));

type Tab = {
	key: string;
	emoji: TIconsName;
};

const EmojiPicker = ({
	onItemClicked,
	isEmojiKeyboard = false,
	searching = false,
	searchedEmojis = []
}: IEmojiPickerProps): React.ReactElement | null => {
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
		<EmojiCategory parentWidth={parentWidth} onEmojiSelected={handleEmojiSelect} category={route.key} />
	);

	const [navigationState, setNavigationState] = React.useState<NavigationState>({
		index: 0,
		routes
	});

	const handleIndexChange = React.useCallback((index: number) => {
		setNavigationState(state => ({ ...state, index }));
	}, []);

	const renderTabBar = useCallback(
		({ jumpTo, routeIndex }: { jumpTo: (key: string) => void; routeIndex: number }) => (
			<View style={styles.tabsContainer}>
				{routes.map((tab: Tab, index: number) => (
					<View key={tab.key} style={styles.tab}>
						<TouchableOpacity onPress={() => jumpTo(tab.key)} hitSlop={10}>
							<CustomIcon
								size={24}
								name={tab.emoji}
								color={routeIndex === index ? colors.strokeHighlight : colors.fontSecondaryInfo}
								style={styles.tabEmoji}
							/>
						</TouchableOpacity>
						<View
							style={[
								styles.tabLine,
								{ backgroundColor: routeIndex === index ? colors.strokeHighlight : colors.strokeExtraLight }
							]}
						/>
					</View>
				))}
			</View>
		),
		[colors]
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
				<ReanimatedTabView
					onIndexChange={handleIndexChange}
					navigationState={navigationState}
					renderScene={renderScene}
					renderMode='lazy'
					renderTabBar={renderTabBar}
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
