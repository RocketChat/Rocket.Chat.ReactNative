import { FlatList, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { type ISelectedUser } from '../../reducers/selectedUsers';
import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import Chip from '../Chip';

const styles = StyleSheet.create(theme => ({
	list: {
		flex: 1,
		maxHeight: '25%',
		backgroundColor: theme.colors.surfaceTint,
		borderColor: theme.colors.strokeLight
	},
	invitedHeader: {
		marginVertical: 12,
		marginHorizontal: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	invitedCount: {
		fontSize: 12,
		...sharedStyles.textRegular,
		color: theme.colors.fontSecondaryInfo
	},
	invitedList: {
		gap: 8,
		paddingHorizontal: 4
	}
}));

export interface ISelectedUsers {
	users: ISelectedUser[];
	useRealName?: boolean;
	onPress: (item: ISelectedUser) => void;
}

const SelectedUsers = ({ users, useRealName, onPress }: ISelectedUsers) => {
	return (
		<>
			<View style={styles.invitedHeader}>
				<Text style={styles.invitedCount}>{I18n.t('N_Selected_members', { n: users.length })}</Text>
			</View>
			<FlatList
				data={users}
				extraData={users}
				numColumns={2}
				keyExtractor={item => item._id}
				style={styles.list}
				contentContainerStyle={styles.invitedList}
				renderItem={({ item }) => {
					const name = useRealName && item.fname ? item.fname : item.name;
					const username = item.name;

					return (
						<Chip text={name} avatar={username} onPress={() => onPress(item)} testID={`create-channel-view-item-${item.name}`} />
					);
				}}
				keyboardShouldPersistTaps='always'
			/>
		</>
	);
};

export default SelectedUsers;
