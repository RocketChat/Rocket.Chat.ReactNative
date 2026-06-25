import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { type ISelectedUser } from '../../reducers/selectedUsers';
import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import Chip from '../Chip';

const styles = StyleSheet.create({
	list: {
		flex: 1,
		maxHeight: '25%'
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
		...sharedStyles.textRegular
	},
	invitedList: {
		gap: 8,
		paddingHorizontal: 4
	}
});

export interface ISelectedUsers {
	users: ISelectedUser[];
	useRealName?: boolean;
	onPress: (item: ISelectedUser) => void;
}

const SelectedUsers = ({ users, useRealName, onPress }: ISelectedUsers) => {
	const { colors } = useTheme();

	return (
		<>
			<View style={styles.invitedHeader}>
				<Text style={[styles.invitedCount, { color: colors.fontSecondaryInfo }]}>
					{I18n.t('N_Selected_members', { n: users.length })}
				</Text>
			</View>
			<FlatList
				data={users}
				extraData={users}
				numColumns={2}
				keyExtractor={item => item._id}
				style={[
					styles.list,
					{
						backgroundColor: colors.surfaceTint,
						borderColor: colors.strokeLight
					}
				]}
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
