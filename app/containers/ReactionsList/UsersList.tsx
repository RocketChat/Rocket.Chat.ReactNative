import React from 'react';
import { Text, View, FlatList } from 'react-native';
import { useSelector } from 'react-redux';

import { useTheme } from '../../theme';
import { IReaction, IApplicationState } from '../../definitions';
import Avatar from '../Avatar';
import styles from './styles';

const UsersList = ({ tabLabel }: { tabLabel: IReaction }): React.ReactElement => {
	const { colors } = useTheme();
	const useRealName = useSelector((state: IApplicationState) => state.settings.UI_Use_Real_Name);

	const { emoji, usernames, names } = tabLabel;
	const users =
		names?.length > 0
			? usernames.map((username, index) => ({ username, name: names[index] }))
			: usernames.map(username => ({ username, name: '' }));

	return (
		<FlatList
			data={users}
			contentContainerStyle={styles.listContainer}
			ListHeaderComponent={
				<View style={styles.emojiNameContainer}>
					<Text style={[styles.emojiName, { color: colors.fontSecondaryInfo }]} testID='usersListEmojiName'>
						{emoji}
					</Text>
				</View>
			}
			renderItem={({ item }) => (
				<View style={styles.listItemContainer} testID='userItem'>
					<Avatar text={item.username} size={36} />
					<View style={styles.textContainer}>
						<Text style={[styles.usernameText, { color: colors.fontDefault }]} numberOfLines={1}>
							{useRealName && item.name ? item.name : item.username}
						</Text>
					</View>
				</View>
			)}
			keyExtractor={item => item.username}
			testID={`usersList-${emoji}`}
		/>
	);
};

export default UsersList;
