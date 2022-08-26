import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TabView, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { shallowEqual } from 'react-redux';

import TabBar from './TabBar';
import EmojiCategory from './EmojiCategory';
import Footer from './Footer';
import styles from './styles';
import categories, { IEmojiCategory } from './categories';
import { emojisByCategory } from './emojis';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import log from '../../lib/methods/helpers/log';
import { useTheme } from '../../theme';
import { IEmoji, ICustomEmojis } from '../../definitions';
import { useAppSelector } from '../../lib/hooks';
import { IEmojiPickerProps, EventTypes } from './interfaces';
import { useFrequentlyUsedEmoji, addFrequentlyUsed } from './frequentlyUsedEmojis';
import { TIconsName } from '../CustomIcon';

const EmojiPicker = ({
	onItemClicked,
	isEmojiKeyboard = false,
	searching = false,
	searchedEmojis = []
}: IEmojiPickerProps): React.ReactElement | null => {
	const { colors } = useTheme();
	const { frequentlyUsed, loaded } = useFrequentlyUsedEmoji();
	const [index, setIndex] = useState(0);
	const [routes] = useState(categories);

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

	const tabsCount = frequentlyUsed.length === 0 ? categories.length - 1 : categories.length;

	const Category = React.memo(({ title }: { title: IEmojiCategory }) => {
		let emojis = [];
		if (title === 'frequentlyUsed') {
			emojis = frequentlyUsed;
		} else if (title === 'custom') {
			emojis = customEmojis;
		} else {
			emojis = emojisByCategory[title];
		}
		return (
			<EmojiCategory
				emojis={emojis}
				onEmojiSelected={(emoji: IEmoji | string) => handleEmojiSelect(emoji)}
				style={styles.categoryContainer}
				baseUrl={baseUrl}
				tabsCount={tabsCount}
			/>
		);
	});

	type Route = {
		key: string;
		title: string;
	};
	type State = NavigationState<Route>;
	const renderTabBar = (props: SceneRendererProps & { navigationState: State }) => (
		<TabBar tabs={categories} onPress={props.jumpTo} activeTab={index} showFrequentlyUsed={frequentlyUsed.length > 0} />
	);

	if (!loaded) {
		return null;
	}

	return (
		<View style={styles.emojiPickerContainer}>
			{searching ? (
				<EmojiCategory
					emojis={searchedEmojis}
					onEmojiSelected={(emoji: IEmoji | string) => handleEmojiSelect(emoji)}
					style={styles.categoryContainer}
					baseUrl={baseUrl}
					tabsCount={tabsCount}
				/>
			) : (
				<TabView
					lazy
					navigationState={{ index, routes }}
					renderScene={({
						route
					}: {
						route: {
							key: TIconsName;
							title: IEmojiCategory;
						};
					}) => <Category key={route.key} title={route.title} />}
					onIndexChange={setIndex}
					style={{ backgroundColor: colors.focusedBackground }}
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
