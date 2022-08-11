import React from 'react';
import { Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';

import { useTheme } from '../../theme';
import { IReaction, IApplicationState } from '../../definitions';
import Avatar from '../Avatar';
import styles from './styles';

const UsersList = ({ tabLabel }: { tabLabel: IReaction }): React.ReactElement => {
	const { colors } = useTheme();
	const { emoji, usernames, names } = tabLabel;
	const users =
		names?.length > 0
			? usernames.map((username, index) => ({ username, name: names[index] }))
			: usernames.map(username => ({ username, name: '' }));

	const useRealName = useSelector((state: IApplicationState) => state.settings.UI_Use_Real_Name);

	return (
		<FlatList
			data={users}
			ListHeaderComponent={() => (
				<View style={styles.emojiName}>
					<Text style={{ color: colors.auxiliaryTintColor }}>{emoji}</Text>
				</View>
			)}
			renderItem={({ item }) => (
				<View style={styles.userItemContainer}>
					<Avatar text={item.username} size={36} />
					<View style={styles.textContainer}>
						<Text style={[styles.usernameText, { color: colors.titleText }]} numberOfLines={1}>
							{useRealName && item.name ? item.name : item.username}
						</Text>
					</View>
				</View>
			)}
			keyExtractor={item => item.username}
		/>
	);
};

export default UsersList;
