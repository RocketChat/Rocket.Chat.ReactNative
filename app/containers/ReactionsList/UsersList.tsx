import React from 'react';
import { Text, View, FlatList, useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { useTheme } from '../../theme';
import { IReaction, IApplicationState } from '../../definitions';
import Avatar from '../Avatar';
import styles from './styles';
import { useActionSheet } from '../ActionSheet';
import { calculatePadding } from './calculatePadding';

const UsersList = ({ tabLabel }: { tabLabel: IReaction }): React.ReactElement => {
	const { colors } = useTheme();
	const useRealName = useSelector((state: IApplicationState) => state.settings.UI_Use_Real_Name);
	const { indexPosition } = useActionSheet();
	const { height } = useWindowDimensions();
	const paddingBottom = calculatePadding(height);

	const { emoji, usernames, names } = tabLabel;
	const users =
		names?.length > 0
			? usernames.map((username, index) => ({ username, name: names[index] }))
			: usernames.map(username => ({ username, name: '' }));

	return (
		<FlatList
			data={users}
			contentContainerStyle={[styles.listContainer, indexPosition === 0 && { paddingBottom }]}
			ListHeaderComponent={
				<View style={styles.emojiNameContainer}>
					<Text style={[styles.emojiName, { color: colors.auxiliaryText }]} testID='usersListEmojiName'>
						{emoji}
					</Text>
				</View>
			}
			renderItem={({ item }) => (
				<View style={styles.listItemContainer} testID='userItem'>
					<Avatar text={item.username} size={36} />
					<View style={styles.textContainer}>
						<Text style={[styles.usernameText, { color: colors.bodyText }]} numberOfLines={1}>
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
