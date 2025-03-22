import React from 'react';
import { Text, View, FlatList } from 'react-native';

import Emoji from '../message/Emoji';
import { useTheme } from '../../theme';
import { IReaction } from '../../definitions';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import I18n from '../../i18n';
import styles from './styles';
import { useAppSelector } from '../../lib/hooks';

interface IAllReactionsListItemProps {
	getCustomEmoji: TGetCustomEmoji;
	item: IReaction;
}

interface IAllTabProps {
	getCustomEmoji: TGetCustomEmoji;
	tabLabel: IReaction;
	reactions?: IReaction[];
}

const AllReactionsListItem = ({ item, getCustomEmoji }: IAllReactionsListItemProps) => {
	const { colors } = useTheme();
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name);
	const username = useAppSelector(state => state.login.user.username);
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
		displayNames = `${displayNames} ${I18n.t('and_N_more', { count: count - 3 })}`;
	} else {
		displayNames = displayNames.replace(/,(?=[^,]*$)/, ` ${I18n.t('and')}`);
	}
	return (
		<View style={styles.listItemContainer}>
			<Emoji
				content={item.emoji}
				standardEmojiStyle={styles.allTabStandardEmojiStyle}
				customEmojiStyle={styles.allTabCustomEmojiStyle}
				getCustomEmoji={getCustomEmoji}
			/>
			<View style={styles.textContainer}>
				<Text style={[styles.allListNPeopleReacted, { color: colors.fontDefault }]}>
					{count === 1 ? I18n.t('1_person_reacted') : I18n.t('N_people_reacted', { n: count })}
				</Text>
				<Text style={[styles.allListWhoReacted, { color: colors.fontSecondaryInfo }]}>{displayNames}</Text>
			</View>
		</View>
	);
};

const AllTab = ({ reactions, getCustomEmoji }: IAllTabProps): React.ReactElement => (
	<View style={styles.allTabContainer} testID='reactionsListAllTab'>
		<FlatList
			data={reactions}
			contentContainerStyle={styles.listContainer}
			renderItem={({ item }) => <AllReactionsListItem item={item} getCustomEmoji={getCustomEmoji} />}
			keyExtractor={item => item.emoji}
		/>
	</View>
);

export default AllTab;
