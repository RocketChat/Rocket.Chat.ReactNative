import React from 'react';
import { Text, Pressable, View, ScrollView } from 'react-native';

import Emoji from '../message/Emoji';
import { useTheme } from '../../theme';
import { IReaction } from '../../definitions';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import I18n from '../../i18n';
import styles, { MIN_TAB_WIDTH } from './styles';

interface ITabBarItem {
	baseUrl: string;
	getCustomEmoji: TGetCustomEmoji;
	tab: IReaction;
	index: number;
	goToPage?: (index: number) => void;
}
interface IReactionsTabBar {
	baseUrl: string;
	getCustomEmoji: TGetCustomEmoji;
	activeTab?: number;
	tabs?: IReaction[];
	goToPage?: (index: number) => void;
	width: number;
}

const TabBarItem = ({ tab, index, goToPage, baseUrl, getCustomEmoji }: ITabBarItem) => {
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
		>
			<View style={styles.tabBarItem}>
				{tab._id === 'All' ? (
					<Text style={{ color: colors.auxiliaryTintColor, fontSize: 18 }}>{I18n.t('All')}</Text>
				) : (
					<>
						<Emoji
							content={tab.emoji}
							standardEmojiStyle={styles.standardEmojiStyle}
							customEmojiStyle={styles.customEmojiStyle}
							baseUrl={baseUrl}
							getCustomEmoji={getCustomEmoji}
						/>
						<Text style={[styles.reactionCount, { color: colors.auxiliaryTintColor }]}>{tab.usernames.length}</Text>
					</>
				)}
			</View>
		</Pressable>
	);
};

const ReactionsTabBar = ({ tabs, activeTab, goToPage, baseUrl, getCustomEmoji, width }: IReactionsTabBar): React.ReactElement => {
	const tabWidth = tabs && Math.max(width / tabs.length, MIN_TAB_WIDTH);
	const { colors } = useTheme();
	return (
		<View>
			<ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
				{tabs?.map((tab, index) => {
					const isActiveTab = activeTab === index;
					return (
						<View
							style={{
								width: tabWidth,
								borderBottomWidth: isActiveTab ? 2 : 1,
								borderColor: isActiveTab ? colors.tintActive : colors.separatorColor
							}}
						>
							<TabBarItem tab={tab} index={index} goToPage={goToPage} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} />
						</View>
					);
				})}
			</ScrollView>
		</View>
	);
};

export default ReactionsTabBar;
