import React, { useState } from 'react';
import { StyleSheet, Text, Pressable, View, ScrollView } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { TabView, SceneRendererProps, NavigationState } from 'react-native-tab-view';

import Emoji from './message/Emoji';
import { useTheme } from '../theme';
import { TGetCustomEmoji } from '../definitions/IEmoji';
import { IReaction } from '../definitions';
import Avatar from './Avatar';
import sharedStyles from '../views/Styles';

const MIN_TAB_WIDTH = 70;

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
	emojiName: { margin: 10 },
	userItemContainer: { marginHorizontal: 10, marginVertical: 5, flexDirection: 'row' },
	usernameContainer: { marginHorizontal: 10, justifyContent: 'center' },
	usernameText: { fontSize: 17, ...sharedStyles.textMedium },
	standardEmojiStyle: { fontSize: 20, color: '#fff' },
	customEmojiStyle: { width: 25, height: 25 }
});

type Route = {
	key: string;
	reaction: IReaction;
};
type State = NavigationState<Route>;

interface IReactionsListBase {
	baseUrl: string;
	getCustomEmoji: TGetCustomEmoji;
}

interface IReactionsListProps extends IReactionsListBase {
	reactions?: IReaction[];
	width: number;
}

interface ITabBarItem extends IReactionsListBase {
	tab: { key: string; reaction: IReaction };
	jumpTo?: (key: string) => void;
}
interface IReactionsTabBar extends IReactionsListBase {
	activeTab?: number;
	tabs?: { key: string; reaction: IReaction }[];
	jumpTo?: (key: string) => void;
	width: number;
}

const TabBarItem = ({ tab, jumpTo, baseUrl, getCustomEmoji }: ITabBarItem) => {
	const { colors } = useTheme();
	return (
		<Pressable
			key={tab.key}
			onPress={() => {
				jumpTo?.(tab.key);
			}}
			style={({ pressed }: { pressed: boolean }) => ({
				opacity: pressed ? 0.7 : 1
			})}
		>
			<View style={styles.tabBarItem}>
				<Emoji
					content={tab.key}
					standardEmojiStyle={styles.standardEmojiStyle}
					customEmojiStyle={styles.customEmojiStyle}
					baseUrl={baseUrl}
					getCustomEmoji={getCustomEmoji}
				/>
				<Text style={[styles.reactionCount, { color: colors.auxiliaryTintColor }]}>{tab.reaction.usernames.length}</Text>
			</View>
		</Pressable>
	);
};

const ReactionsTabBar = ({ tabs, activeTab, jumpTo, baseUrl, getCustomEmoji, width }: IReactionsTabBar) => {
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
							<TabBarItem tab={tab} jumpTo={jumpTo} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} />
						</View>
					);
				})}
			</ScrollView>
		</View>
	);
};

const UsersList = ({ tabLabel }: { tabLabel: IReaction }) => {
	const { colors } = useTheme();
	const { emoji, usernames } = tabLabel;
	return (
		<FlatList
			data={usernames}
			ListHeaderComponent={() => (
				<View style={styles.emojiName}>
					<Text style={{ color: colors.auxiliaryTintColor }}>{emoji}</Text>
				</View>
			)}
			renderItem={({ item }) => (
				<View style={styles.userItemContainer}>
					<Avatar text={item} size={36} />
					<View style={styles.usernameContainer}>
						<Text style={[styles.usernameText, { color: colors.titleText }]}>{item}</Text>
					</View>
				</View>
			)}
			keyExtractor={item => item}
		/>
	);
};

const ReactionsList = ({ reactions, baseUrl, getCustomEmoji, width }: IReactionsListProps): React.ReactElement => {
	const [index, setIndex] = useState(0);

	// sorting reactions in descending order on the basic of number of users reacted
	const sortedReactions = reactions?.sort((reaction1, reaction2) => reaction2.usernames.length - reaction1.usernames.length);
	const routes = sortedReactions ? sortedReactions?.map(reaction => ({ key: reaction.emoji, reaction })) : [];

	return (
		<View style={styles.reactionsListContainer}>
			<TabView
				lazy
				navigationState={{ index, routes }}
				renderScene={({ route }) => <UsersList tabLabel={route.reaction} />}
				onIndexChange={setIndex}
				renderTabBar={(props: SceneRendererProps & { navigationState: State }) => (
					<ReactionsTabBar
						tabs={routes}
						jumpTo={props.jumpTo}
						width={width}
						baseUrl={baseUrl}
						getCustomEmoji={getCustomEmoji}
						activeTab={index}
					/>
				)}
			/>
		</View>
	);
};

export default ReactionsList;
