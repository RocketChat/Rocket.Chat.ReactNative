import React from 'react';
import { Text, View } from 'react-native';

import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { IReaction } from '../../definitions';
import I18n from '../../i18n';
import styles from './styles';
import AllTab from './AllTab';
import UsersList from './UsersList';
import { TabView } from '../TabView';
import Emoji from '../message/Emoji';

interface IReactionsListProps {
	getCustomEmoji: TGetCustomEmoji;
	reactions?: IReaction[];
}

interface IRoute {
	key: string;
	title?: string;
	emoji?: string;
	usernames?: string[];
	names?: string[];
}

const useRoutes = (reactions: IReaction[] | undefined) => {
	if (!reactions) {
		return {
			routes: [],
			sortedReactions: []
		};
	}

	const sortedReactions = reactions?.sort((reaction1, reaction2) => reaction2.usernames.length - reaction1.usernames.length);
	const routes: IRoute[] = sortedReactions.map(reaction => ({
		key: reaction.emoji,
		title: reaction.emoji,
		emoji: reaction.emoji,
		usernames: reaction.usernames,
		names: reaction.names
	}));

	routes.unshift({
		key: 'all',
		title: 'All'
	});

	return {
		routes,
		sortedReactions
	};
};

const ReactionsList = ({ reactions, getCustomEmoji }: IReactionsListProps) => {
	const { routes, sortedReactions } = useRoutes(reactions);

	const renderScene = ({ route }: { route: IRoute }) => {
		if (route.key === 'all') {
			return <AllTab reactions={sortedReactions} getCustomEmoji={getCustomEmoji} />;
		}
		if (route.emoji && route.usernames && route.names) {
			return <UsersList emoji={route.emoji} usernames={route.usernames} names={route.names} />;
		}
		return null;
	};

	const renderTabItem = (tab: IRoute, color: string) => {
		if (tab.key === 'all') {
			return (
				<View style={styles.tabBarItem}>
					<Text style={[styles.allTabItem, { color }]}>{I18n.t('All')}</Text>
				</View>
			);
		}
		if (tab.emoji) {
			return (
				<View style={styles.tabBarItem}>
					<Emoji
						content={tab.emoji}
						standardEmojiStyle={styles.standardEmojiStyle}
						customEmojiStyle={styles.customEmojiStyle}
						getCustomEmoji={getCustomEmoji}
					/>
					<Text style={[styles.reactionCount, { color }]}>{tab.usernames?.length}</Text>
				</View>
			);
		}
		return null;
	};

	return (
		<View style={styles.container} testID='reactionsList'>
			<TabView renderScene={renderScene} renderTabItem={renderTabItem} routes={routes} />
		</View>
	);
};

export default ReactionsList;
