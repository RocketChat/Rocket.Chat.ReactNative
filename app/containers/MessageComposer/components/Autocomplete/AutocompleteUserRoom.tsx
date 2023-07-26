import { View, Text } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { IAutocompleteUserRoom } from '../../interfaces';
import Avatar from '../../../Avatar';
import RoomTypeIcon from '../../../RoomTypeIcon';

export const AutocompleteUserRoom = ({ item }: { item: IAutocompleteUserRoom }) => {
	const { colors } = useTheme();
	return (
		<>
			<Avatar rid={item.id} text={item.subtitle} size={36} type={item.t} />
			<View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
				<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
					<RoomTypeIcon userId={item.id} type={item.t} status={item.status} size={16} teamMain={item.teamMain} />
					<Text style={[sharedStyles.textBold, { fontSize: 14, color: colors.fontDefault }]} numberOfLines={1}>
						{item.title}
					</Text>
				</View>
				{item.type === '#' ? null : (
					<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
						<Text
							style={[sharedStyles.textRegular, { fontSize: 14, color: colors.fontSecondaryInfo, flex: 1 }]}
							// numberOfLines={item.type === '!' ? 0 : 1}
						>
							{item.subtitle}
						</Text>
						{item.outside ? (
							<Text style={[sharedStyles.textRegular, { fontSize: 12, color: colors.fontSecondaryInfo }]}>Not in channel</Text>
						) : null}
					</View>
				)}
			</View>
		</>
	);
};
