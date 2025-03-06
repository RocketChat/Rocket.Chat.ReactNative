import React, { useRef } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';

import { themes } from '../../lib/constants';
import SearchBox from '../../containers/SearchBox';
import I18n from '../../i18n';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { useAppSelector } from '../../lib/hooks';
import Chip from '../../containers/Chip';

const styles = StyleSheet.create({
	selectedText: {
		marginLeft: 16,
		marginBottom: 12,
		fontSize: 12,
		...sharedStyles.textRegular
	},
	contentContainerList: {
		paddingHorizontal: 16,
		marginBottom: 16
	}
});

const Header = ({
	onChangeText,
	useRealName,
	onPressItem
}: {
	useRealName: boolean;
	onChangeText: (text: string) => void;
	onPressItem: (userItem: ISelectedUser) => void;
}) => {
	const flatlist = useRef<FlatList>();
	const { theme } = useTheme();
	const { users } = useAppSelector(state => ({
		users: state.selectedUsers.users
	}));

	const onContentSizeChange = () => flatlist?.current?.scrollToEnd({ animated: true });

	return (
		<View style={{ backgroundColor: themes[theme].surfaceRoom }}>
			<SearchBox onChangeText={(text: string) => onChangeText(text)} testID='select-users-view-search' />
			{users.length === 0 ? null : (
				<View>
					<Text style={[styles.selectedText, { color: themes[theme].fontHint }]}>
						{I18n.t('N_Selected_members', { n: users.length })}
					</Text>
					<FlatList
						data={users}
						ref={(ref: FlatList) => (flatlist.current = ref)}
						onContentSizeChange={onContentSizeChange}
						keyExtractor={item => item._id}
						renderItem={({ item }) => {
							const name = useRealName && item.fname ? item.fname : item.name;
							const username = item.search ? (item.username as string) : item.name;

							return (
								<Chip text={name} avatar={username} onPress={() => onPressItem(item)} testID={`selected-user-${item.name}`} />
							);
						}}
						keyboardShouldPersistTaps='always'
						contentContainerStyle={styles.contentContainerList}
						horizontal
					/>
				</View>
			)}
		</View>
	);
};

export default Header;
