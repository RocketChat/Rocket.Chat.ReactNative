import { FlatList, StyleSheet, Text, View } from 'react-native';

import SearchBox from '~/containers/SearchBox';
import I18n from '~/i18n';
import { hasNativeHeaderBar, isIOS26OrLater } from '~/lib/methods/helpers';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import { type ICategoryRoom } from '../types';
import RoomChip from './RoomChip';
import TextWithBoldName from './TextWithBoldName';

const styles = StyleSheet.create({
	container: {
		paddingBottom: 16,
		gap: 16
	},
	caption: {
		marginHorizontal: 16,
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular
	},
	selected: {
		gap: 10
	},
	chips: {
		paddingHorizontal: isIOS26OrLater ? 16 : 12,
		gap: 8
	}
});

interface ISelectedRoomsHeader {
	selectedRooms: ICategoryRoom[];
	onSearch: (text: string) => void;
	onRemove: (room: ICategoryRoom) => void;
	categoryName?: string;
}

const SelectedRoomsHeader = ({ selectedRooms, onSearch, onRemove, categoryName }: ISelectedRoomsHeader) => {
	const { colors } = useTheme();
	const captionStyle = [styles.caption, { color: colors.fontSecondaryInfo }];

	return (
		<View style={styles.container}>
			{categoryName ? (
				<TextWithBoldName translationKey='Select_rooms_for_category' name={categoryName} style={captionStyle} />
			) : null}
			<View>
				{hasNativeHeaderBar ? null : (
					<SearchBox placeholder={I18n.t('Search_rooms')} onChangeText={onSearch} testID='create-category-rooms-search' />
				)}
				<Text style={captionStyle}>{I18n.t('Rooms_can_be_added_later')}</Text>
			</View>
			{selectedRooms.length > 0 ? (
				<View style={styles.selected}>
					<Text style={captionStyle}>{I18n.t('N_Selected_members', { n: selectedRooms.length })}</Text>
					<FlatList
						horizontal
						data={selectedRooms}
						keyExtractor={room => room.rid}
						renderItem={({ item }) => <RoomChip room={item} onRemove={onRemove} />}
						contentContainerStyle={styles.chips}
						showsHorizontalScrollIndicator={false}
						keyboardShouldPersistTaps='always'
					/>
				</View>
			) : null}
		</View>
	);
};

export default SelectedRoomsHeader;
