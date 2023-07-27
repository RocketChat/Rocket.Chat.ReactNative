import { View, Text } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { IAutocompleteUserRoom } from '../../interfaces';
import Avatar from '../../../Avatar';
import RoomTypeIcon from '../../../RoomTypeIcon';
import { isAllOrHere } from '../../helpers/isAllOrHere';
import I18n from '../../../../i18n';

export const AutocompleteUserRoom = ({ item }: { item: IAutocompleteUserRoom }) => {
	const { colors } = useTheme();

	return (
		<>
			{!isAllOrHere(item) ? <Avatar rid={item.id} text={item.subtitle} size={36} type={item.t} /> : null}
			<View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
				<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
					{!isAllOrHere(item) ? (
						<RoomTypeIcon userId={item.id} type={item.t} status={item.status} size={16} teamMain={item.teamMain} />
					) : null}
					<Text style={[sharedStyles.textBold, { fontSize: 14, color: colors.fontDefault }]} numberOfLines={1}>
						{isAllOrHere(item) ? `@${item.title}` : item.title}
					</Text>
				</View>
				{item.type === '#' ? null : (
					<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
						<Text style={[sharedStyles.textRegular, { fontSize: 14, color: colors.fontSecondaryInfo, flex: 1 }]}>
							{item.subtitle}
						</Text>
						{item.outside ? (
							<Text style={[sharedStyles.textRegular, { fontSize: 12, color: colors.fontSecondaryInfo }]}>
								{I18n.t('Not_in_channel')}
							</Text>
						) : null}
					</View>
				)}
			</View>
		</>
	);
};
