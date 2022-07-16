import React from 'react';
import { FlatList, StyleSheet, Text, Pressable, View } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';

import Emoji from './message/Emoji';
import { useTheme } from '../theme';
import { TGetCustomEmoji } from '../definitions/IEmoji';
import { IReaction } from '../definitions';
import Avatar from './Avatar';
import sharedStyles from '../views/Styles';

const styles = StyleSheet.create({
	reactionsListContainer: { height: '100%', width: '100%' },
	tabBarItem: {
		paddingHorizontal: 10,
		paddingBottom: 10,
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row'
	},
	reactionCount: { marginLeft: 5 },
	tabLine: { position: 'absolute', left: 0, right: 0, bottom: 0 },
	emojiName: { margin: 10 },
	userItemContainer: { marginHorizontal: 10, marginVertical: 5, flexDirection: 'row' },
	usernameContainer: { marginHorizontal: 10, justifyContent: 'center' },
	usernameText: { fontSize: 17, ...sharedStyles.textMedium }
});
const standardEmojiStyle = { fontSize: 20, color: '#fff' };
const customEmojiStyle = { width: 25, height: 25 };

interface IReactionsListBase {
	baseUrl: string;
	getCustomEmoji: TGetCustomEmoji;
}

interface IReactionsListProps extends IReactionsListBase {
	reactions?: IReaction[];
}

interface ITabBarItem extends IReactionsListBase {
	tab: IReaction;
	index: number;
	activeTab?: number;
	goToPage?: (index: number) => void;
}
interface IReactionsTabBar extends IReactionsListBase {
	activeTab?: number;
	tabs?: IReaction[];
	goToPage?: (index: number) => void;
}

const TabBarItem = ({ tab, index, goToPage, activeTab, baseUrl, getCustomEmoji }: ITabBarItem) => {
	const { colors } = useTheme();
	return (
		<Pressable
			key={tab.emoji}
			onPress={() => {
				goToPage?.(index);
			}}
			style={({ pressed }: { pressed: boolean }) => ({
				opacity: pressed ? 0.7 : 1
			})}>
			<View style={styles.tabBarItem}>
				<Emoji
					content={tab.emoji}
					standardEmojiStyle={standardEmojiStyle}
					customEmojiStyle={customEmojiStyle}
					baseUrl={baseUrl}
					getCustomEmoji={getCustomEmoji}
				/>
				<Text style={[styles.reactionCount, { color: colors.auxiliaryTintColor }]}>{tab.usernames.length}</Text>
			</View>
			<View
				style={[
					styles.tabLine,
					activeTab === index
						? { backgroundColor: colors.tintColor, height: 2 }
						: {
								backgroundColor: colors.separatorColor,
								height: 1
						  }
				]}
			/>
		</Pressable>
	);
};

const ReactionsTabBar = ({ tabs, activeTab, goToPage, baseUrl, getCustomEmoji }: IReactionsTabBar) => (
	<View>
		<FlatList
			data={tabs}
			keyExtractor={item => item.emoji}
			horizontal
			showsHorizontalScrollIndicator={false}
			renderItem={({ item, index }) => (
				<TabBarItem
					tab={item}
					index={index}
					activeTab={activeTab}
					goToPage={goToPage}
					baseUrl={baseUrl}
					getCustomEmoji={getCustomEmoji}
				/>
			)}
		/>
	</View>
);

const UsersList = ({ tabLabel }: { tabLabel: IReaction }) => {
	const { colors } = useTheme();
	const { emoji, usernames } = tabLabel;
	return (
		<View>
			<View style={styles.emojiName}>
				<Text style={{ color: colors.auxiliaryTintColor }}>{emoji}</Text>
			</View>
			<FlatList
				data={usernames}
				renderItem={({ item }: { item: string }) => (
					<View style={styles.userItemContainer}>
						<Avatar text={item} size={36} />
						<View style={styles.usernameContainer}>
							<Text style={[styles.usernameText, { color: colors.titleText }]}>{item}</Text>
						</View>
					</View>
				)}
				keyExtractor={item => item}
			/>
		</View>
	);
};

const ReactionsList = ({ reactions, baseUrl, getCustomEmoji }: IReactionsListProps): React.ReactElement => {
	// sorting reactions in descending order on the basic of number of users reacted
	const sortedReactions = reactions?.sort((reaction1, reaction2) => reaction2.usernames.length - reaction1.usernames.length);

	return (
		<View style={styles.reactionsListContainer}>
			<ScrollableTabView renderTabBar={() => <ReactionsTabBar baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} />}>
				{sortedReactions?.map(reaction => (
					<UsersList tabLabel={reaction} />
				))}
			</ScrollableTabView>
		</View>
	);
};

export default ReactionsList;
