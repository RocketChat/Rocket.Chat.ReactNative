import React, { useCallback, useState } from 'react';
import { useWindowDimensions, Text, View, Pressable } from 'react-native';
// import ScrollableTabView from 'react-native-scrollable-tab-view';
import { TabView, TabBar } from 'react-native-tab-view';

// import TabBar from './TabBar';
import EmojiCategory from './EmojiCategory';
import Footer from './Footer';
import styles from './styles';
import { categories, colors, emojis, emojisByCategory } from '../../lib/constants';
import { useTheme } from '../../theme';
import { IEmoji, ICustomEmojis } from '../../definitions';
import { useAppSelector, useFrequentlyUsedEmoji } from '../../lib/hooks';
import { addFrequentlyUsed } from '../../lib/methods';
import { IEmojiPickerProps, EventTypes } from './interfaces';
import { CustomIcon } from '../CustomIcon';
import { isIOS } from '../../lib/methods/helpers';

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

	const renderScene = ({ route }: { route: any }) => {
		console.log('route', route);
		// let emojis = [];
		// if (index === 0) {
		// 	emojis = frequentlyUsed;
		// } else if (index === 1) {
		// 	emojis = customEmojis;
		// } else {
		// 	emojis = emojisByCategory[route.key];
		// }
		// const emojis = emojisByCategory[route.key];
		// console.log('emojis', emojis);
		// if (!emojis?.length) {
		// 	return null;
		// }
		return (
			<EmojiCategory
				parentWidth={parentWidth}
				// emojis={emojis}
				onEmojiSelected={(emoji: IEmoji) => handleEmojiSelect(emoji)}
				category={route.key}
			/>
		);
		// switch (route.key) {
		// 	case 'people':
		// 		return (
		// 			<EmojiCategory
		// 				parentWidth={300}
		// 				emojis={emojis}
		// 				onEmojiSelected={(emoji: IEmoji) => handleEmojiSelect(emoji)}
		// 				tabLabel={'people'}
		// 			/>
		// 		);
		// 	default:
		// 		return null;
		// }
	};

	// if (!loaded) {
	// 	return null;
	// }

	return (
		<View style={styles.emojiPickerContainer} onLayout={e => setParentWidth(e.nativeEvent.layout.width)}>
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
				renderLazyPlaceholder={() => <View style={{ backgroundColor: 'red', height: 100, width: 100 }} />}
			/>
		</View>
	);
};
export default EmojiPicker;

// const EmojiPicker = ({
// 	onItemClicked,
// 	isEmojiKeyboard = false,
// 	searching = false,
// 	searchedEmojis = []
// }: IEmojiPickerProps): React.ReactElement | null => {
// 	const { colors } = useTheme();
// 	const [parentWidth, setParentWidth] = useState(0);

// 	const { frequentlyUsed, loaded } = useFrequentlyUsedEmoji();

// 	const allCustomEmojis: ICustomEmojis = useAppSelector(
// 		state => state.customEmojis,
// 		() => true
// 	);
// 	const customEmojis = Object.keys(allCustomEmojis)
// 		.filter(item => item === allCustomEmojis[item].name)
// 		.map(item => ({
// 			name: allCustomEmojis[item].name,
// 			extension: allCustomEmojis[item].extension
// 		}));

// 	const handleEmojiSelect = (emoji: IEmoji) => {
// 		onItemClicked(EventTypes.EMOJI_PRESSED, emoji);
// 		addFrequentlyUsed(emoji);
// 	};

// 	const renderCategory = (category: keyof typeof emojisByCategory, i: number, label: string) => {
// 		let emojis = [];
// 		if (i === 0) {
// 			emojis = frequentlyUsed;
// 		} else if (i === 1) {
// 			emojis = customEmojis;
// 		} else {
// 			emojis = emojisByCategory[category];
// 		}
// 		if (!emojis.length) {
// 			return null;
// 		}
// 		return (
// 			<EmojiCategory
// 				parentWidth={parentWidth}
// 				emojis={emojis}
// 				onEmojiSelected={(emoji: IEmoji) => handleEmojiSelect(emoji)}
// 				tabLabel={label}
// 			/>
// 		);
// 	};

// 	if (!loaded) {
// 		return null;
// 	}

// 	return (
// 		<View style={styles.emojiPickerContainer} onLayout={e => setParentWidth(e.nativeEvent.layout.width)}>
// 			{searching ? (
// 				<EmojiCategory
// 					emojis={searchedEmojis}
// 					onEmojiSelected={(emoji: IEmoji) => handleEmojiSelect(emoji)}
// 					parentWidth={parentWidth}
// 				/>
// 			) : (
// 				<ScrollableTabView
// 					renderTabBar={() => <TabBar />}
// 					contentProps={{
// 						keyboardShouldPersistTaps: 'always',
// 						keyboardDismissMode: 'none'
// 					}}
// 					style={{ backgroundColor: colors.surfaceLight }}>
// 					{categories.tabs.map((tab: any, i) => renderCategory(tab.category, i, tab.tabLabel))}
// 				</ScrollableTabView>
// 			)}
// 			{isEmojiKeyboard && (
// 				<Footer
// 					onSearchPressed={() => onItemClicked(EventTypes.SEARCH_PRESSED)}
// 					onBackspacePressed={() => onItemClicked(EventTypes.BACKSPACE_PRESSED)}
// 				/>
// 			)}
// 		</View>
// 	);
// };

// export default EmojiPicker;
