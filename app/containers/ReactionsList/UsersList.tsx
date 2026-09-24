import { memo, type ReactElement } from 'react';
import { View, FlatList } from 'react-native';
import { PlainText } from 'react-native-plain-text';
import { useSelector } from 'react-redux';

import { useTheme } from '~/theme';
import { type IApplicationState } from '~/definitions';
import Avatar from '../Avatar';
import styles from './styles';

const UsersList = ({ emoji, usernames, names }: { emoji: string; usernames: string[]; names: string[] }): ReactElement => {
	const { colors } = useTheme();
	const useRealName = useSelector((state: IApplicationState) => state.settings.UI_Use_Real_Name);

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
					<PlainText style={[styles.emojiName, { color: colors.fontSecondaryInfo }]} testID='usersListEmojiName'>
						{emoji}
					</PlainText>
				</View>
			}
			renderItem={({ item }) => (
				<View style={styles.listItemContainer} testID='userItem'>
					<Avatar text={item.username} size={36} />
					<View style={styles.textContainer}>
						<PlainText style={[styles.usernameText, { color: colors.fontDefault }]} numberOfLines={1}>
							{useRealName && item.name ? item.name : item.username}
						</PlainText>
					</View>
				</View>
			)}
			keyExtractor={item => item.username}
			testID={`usersList-${emoji}`}
		/>
	);
};

export default memo(UsersList);
