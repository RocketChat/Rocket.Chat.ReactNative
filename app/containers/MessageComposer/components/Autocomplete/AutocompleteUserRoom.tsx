import React from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { IAutocompleteUserRoom } from '../../interfaces';
import Avatar from '../../../Avatar';
import RoomTypeIcon from '../../../RoomTypeIcon';
import { fetchIsAllOrHere } from '../../helpers';
import I18n from '../../../../i18n';

export const AutocompleteUserRoom = ({ item }: { item: IAutocompleteUserRoom }) => {
	const { colors } = useTheme();

	const isAllOrHere = fetchIsAllOrHere(item);

	return (
		<>
			{!isAllOrHere ? <Avatar rid={item.id} text={item.subtitle} size={36} type={item.t} /> : null}
			<View style={{ flex: 1, justifyContent: 'center', paddingLeft: isAllOrHere ? 0 : 12 }}>
				<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
					{!isAllOrHere ? (
						<RoomTypeIcon userId={item.id} type={item.t} status={item.status} size={16} teamMain={item.teamMain} />
					) : null}
					<View style={{ paddingLeft: isAllOrHere ? 0 : 2 }}>
						<Text style={[sharedStyles.textBold, { fontSize: 14, color: colors.fontDefault }]} numberOfLines={1}>
							{isAllOrHere ? `@${item.title}` : item.title}
						</Text>
					</View>
				</View>
				{item.type === '#' ? null : (
					<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingTop: 2 }}>
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
