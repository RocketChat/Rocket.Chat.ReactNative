import React from 'react';
import { Text, Pressable, View, ScrollView } from 'react-native';

import Emoji from '../message/Emoji';
import { useTheme } from '../../theme';
import { IReaction } from '../../definitions';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import I18n from '../../i18n';
import styles, { MIN_TAB_WIDTH } from './styles';
import { useDimensions } from '../../dimensions';

interface ITabBarItem {
	getCustomEmoji: TGetCustomEmoji;
	tab: IReaction;
	index: number;
	goToPage?: (index: number) => void;
}
interface IReactionsTabBar {
	getCustomEmoji: TGetCustomEmoji;
	activeTab?: number;
	tabs?: IReaction[];
	goToPage?: (index: number) => void;
}

const TabBarItem = ({ tab, index, goToPage, getCustomEmoji }: ITabBarItem) => {
	const { colors } = useTheme();
	return (
		<Pressable
			key={tab.emoji}
			onPress={() => {
				goToPage?.(index);
			}}
			style={({ pressed }: { pressed: boolean }) => ({
				opacity: pressed ? 0.7 : 1
			})}
			testID={`tabBarItem-${tab.emoji}`}>
			<View style={styles.tabBarItem}>
				{tab._id === 'All' ? (
					<Text style={[styles.allTabItem, { color: colors.fontHint }]}>{I18n.t('All')}</Text>
				) : (
					<>
						<Emoji
							content={tab.emoji}
							standardEmojiStyle={styles.standardEmojiStyle}
							customEmojiStyle={styles.customEmojiStyle}
							getCustomEmoji={getCustomEmoji}
						/>
						<Text style={[styles.reactionCount, { color: colors.fontHint }]}>{tab.usernames.length}</Text>
					</>
				)}
			</View>
		</Pressable>
	);
};

const ReactionsTabBar = ({ tabs, activeTab, goToPage, getCustomEmoji }: IReactionsTabBar): React.ReactElement => {
	const { width } = useDimensions();
	const tabWidth = tabs && Math.max(width / tabs.length, MIN_TAB_WIDTH);
	const { colors } = useTheme();
	return (
		<View testID='reactionsTabBar'>
			<ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
				{tabs?.map((tab, index) => {
					const isActiveTab = activeTab === index;
					return (
						<View
							style={{
								width: tabWidth,
								borderBottomWidth: isActiveTab ? 2 : 1,
								borderColor: isActiveTab ? colors.strokeHighlight : colors.strokeLight
							}}
							key={tab.emoji}>
							<TabBarItem tab={tab} index={index} goToPage={goToPage} getCustomEmoji={getCustomEmoji} />
						</View>
					);
				})}
			</ScrollView>
		</View>
	);
};

export default ReactionsTabBar;
