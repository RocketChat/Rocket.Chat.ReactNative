import React, { useRef } from 'react';
import { FlatList, View, Text } from 'react-native';

import { themes } from '../../lib/constants';
import SearchBox from '../../containers/SearchBox';
import I18n from '../../i18n';
import { ISelectedUser } from '../../reducers/selectedUsers';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { useAppSelector } from '../../lib/hooks';
import SelectedChipItem from './SelectedChipItem';

const ITEM_WIDTH = 250;
const getItemLayout = (_: any, index: number) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index });

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
		<View style={{ backgroundColor: themes[theme].backgroundColor }}>
			<SearchBox onChangeText={(text: string) => onChangeText(text)} testID='select-users-view-search' />
			{users.length === 0 ? null : (
				<View>
					<Text style={{ ...sharedStyles.textRegular, color: themes[theme].auxiliaryTintColor, marginLeft: 16 }}>
						{I18n.t('N_Selected_members', { n: users.length })}
					</Text>
					<FlatList
						data={users}
						ref={(ref: FlatList) => (flatlist.current = ref)}
						onContentSizeChange={onContentSizeChange}
						getItemLayout={getItemLayout}
						keyExtractor={item => item._id}
						renderItem={({ item }) => <SelectedChipItem onPressItem={onPressItem} useRealName={useRealName} item={item} />}
						keyboardShouldPersistTaps='always'
						contentContainerStyle={{ paddingLeft: 16 }}
						horizontal
					/>
				</View>
			)}
		</View>
	);
};

export default Header;
