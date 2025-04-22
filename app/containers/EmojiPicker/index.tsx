import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { TabView as ReanimatedTabView, type NavigationState } from 'reanimated-tab-view';
import { TouchableOpacity } from 'react-native-gesture-handler';

import EmojiCategory from './EmojiCategory';
import Footer from './Footer';
import styles from './styles';
import { categories, colors, emojis, emojisByCategory } from '../../lib/constants';
import { useTheme } from '../../theme';
import { IEmoji } from '../../definitions';
import { addFrequentlyUsed } from '../../lib/methods';
import { IEmojiPickerProps, EventTypes } from './interfaces';
import { CustomIcon } from '../CustomIcon';

const routes = categories.tabs.map((tab: any, index: number) => ({
	key: tab.category,
	title: tab.tabLabel
}));

const EmojiPicker = ({
	onItemClicked,
	isEmojiKeyboard = false,
	searching = false,
	searchedEmojis = []
}: IEmojiPickerProps): React.ReactElement | null => {
	const { colors } = useTheme();
	const [parentWidth, setParentWidth] = useState(0);

	const handleEmojiSelect = useCallback((emoji: IEmoji) => {
		onItemClicked(EventTypes.EMOJI_PRESSED, emoji);
		addFrequentlyUsed(emoji);
	}, []);

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

	const renderTabBar = ({ jumpTo, routeIndex }: { jumpTo: (key: string) => void; routeIndex: number }) => {
		return (
			<View
				style={{
					flexDirection: 'row',
					width: '100%'
				}}>
				{routes.map((tab: any, i) => (
					<View key={i} style={{ flexDirection: 'column', flex: 1, alignItems: 'center' }}>
						<TouchableOpacity key={i} onPress={() => jumpTo(tab.key)} hitSlop={10}>
							<CustomIcon
								key={i}
								size={24}
								name={tab.title}
								color={routeIndex === i ? colors.strokeHighlight : colors.fontSecondaryInfo}
								style={{ paddingVertical: 4 }}
							/>
						</TouchableOpacity>
						<View
							style={{
								width: '100%',
								height: 2,
								backgroundColor: routeIndex === i ? colors.strokeHighlight : colors.strokeExtraLight
							}}
						/>
					</View>
				))}
			</View>
		);
	};

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
