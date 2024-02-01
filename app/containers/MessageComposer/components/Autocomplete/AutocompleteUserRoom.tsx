import React from 'react';
import { View, Text } from 'react-native';

import { IAutocompleteUserRoom } from '../../interfaces';
import Avatar from '../../../Avatar';
import RoomTypeIcon from '../../../RoomTypeIcon';
import { fetchIsAllOrHere } from '../../helpers';
import I18n from '../../../../i18n';
import { useStyle } from './styles';

export const AutocompleteUserRoom = ({ item }: { item: IAutocompleteUserRoom }) => {
	const [styles] = useStyle();
	const isAllOrHere = fetchIsAllOrHere(item);

	return (
		<>
			{!isAllOrHere ? <Avatar rid={item.id} text={item.subtitle} size={36} type={item.t} /> : null}
			<View style={[styles.userRoom, { paddingLeft: isAllOrHere ? 0 : 12 }]}>
				<View style={styles.userRoomHeader}>
					{!isAllOrHere ? (
						<RoomTypeIcon userId={item.id} type={item.t} status={item.status} size={16} teamMain={item.teamMain} />
					) : null}
					<View style={{ paddingLeft: isAllOrHere ? 0 : 2 }}>
						<Text style={styles.userRoomTitleText} numberOfLines={1}>
							{isAllOrHere ? `@${item.title}` : item.title}
						</Text>
					</View>
				</View>
				{item.type === '#' ? null : (
					<View style={styles.userRoomSubtitle}>
						<Text style={styles.userRoomSubtitleText}>{item.subtitle}</Text>
						{item.outside ? <Text style={styles.userRoomOutsideText}>{I18n.t('Not_in_channel')}</Text> : null}
					</View>
				)}
			</View>
		</>
	);
};
