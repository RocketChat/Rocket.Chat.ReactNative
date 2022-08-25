import React from 'react';
import { Text, View, FlatList } from 'react-native';
import { useSelector } from 'react-redux';

import Emoji from '../message/Emoji';
import { useTheme } from '../../theme';
import { IReaction, IApplicationState } from '../../definitions';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import I18n from '../../i18n';
import styles from './styles';

interface IAllReactionsListItemProps {
	baseUrl: string;
	getCustomEmoji: TGetCustomEmoji;
	item: IReaction;
	username: string;
}

interface IAllTabProps {
	baseUrl: string;
	getCustomEmoji: TGetCustomEmoji;
	tabLabel: IReaction;
	reactions?: IReaction[];
	username: string;
}

const AllReactionsListItem = ({ item, baseUrl, getCustomEmoji, username }: IAllReactionsListItemProps) => {
	const { colors } = useTheme();
	const useRealName = useSelector((state: IApplicationState) => state.settings.UI_Use_Real_Name);
	const count = item.usernames.length;

	let displayNames;
	if (useRealName && item.names) {
		displayNames = item.names
			.slice(0, 3)
			.map((name, index) => (item.usernames[index] === username ? I18n.t('you') : name))
			.join(', ');
	} else {
		displayNames = item.usernames
			.slice(0, 3)
			.map((otherUsername: string) => (username === otherUsername ? I18n.t('you') : otherUsername))
			.join(', ');
	}
	if (count > 3) {
		displayNames = `${displayNames} ${I18n.t('and_more')} ${count - 3}`;
	} else {
		displayNames = displayNames.replace(/,(?=[^,]*$)/, ` ${I18n.t('and')}`);
	}
	return (
		<View style={styles.listItemContainer}>
			<Emoji
				content={item.emoji}
				standardEmojiStyle={styles.allTabStandardEmojiStyle}
				customEmojiStyle={styles.allTabCustomEmojiStyle}
				baseUrl={baseUrl}
				getCustomEmoji={getCustomEmoji}
			/>
			<View style={styles.textContainer}>
				<Text style={[styles.allListNPeopleReacted, { color: colors.bodyText }]}>
					{count === 1 ? I18n.t('1_person_reacted') : I18n.t('N_people_reacted', { n: count })}
				</Text>
				<Text style={[styles.allListWhoReacted, { color: colors.auxiliaryText }]}>{displayNames}</Text>
			</View>
		</View>
	);
};

const AllTab = ({ reactions, baseUrl, getCustomEmoji, username }: IAllTabProps): React.ReactElement => (
	<View style={styles.allTabContainer} testID='reactionsListAllTab'>
		<FlatList
			data={reactions}
			contentContainerStyle={styles.listContainer}
			renderItem={({ item }) => (
				<AllReactionsListItem item={item} baseUrl={baseUrl} getCustomEmoji={getCustomEmoji} username={username} />
			)}
			keyExtractor={item => item.emoji}
		/>
	</View>
);

export default AllTab;
