import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { getAvatarURL } from '../../lib/methods/helpers/getAvatarUrl';
import I18n from '../../i18n';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import styles from './styles';
import { IForwardMessageViewSelectRoom } from './interfaces';
import { ISearchLocal } from '../../definitions';
import { localSearchSubscription } from '../../lib/methods';
import { getRoomAvatar, getRoomTitle } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';

const SelectPersonOrChannel = ({
	server,
	token,
	userId,
	onRoomSelect,
	blockUnauthenticatedAccess,
	serverVersion
}: IForwardMessageViewSelectRoom): React.ReactElement => {
	const [rooms, setRooms] = useState<ISearchLocal[]>([]);
	const { colors } = useTheme();

	const getRooms = async (keyword = '') => {
		try {
			const res = await localSearchSubscription({ text: keyword, filterMessagingAllowed: true });
			setRooms(res);
			return res.map(item => ({
				value: item.rid,
				text: { text: getRoomTitle(item) },
				imageUrl: getAvatar(item)
			}));
		} catch {
			// do nothing
		}
	};

	useEffect(() => {
		getRooms('');
	}, []);

	const getAvatar = (item: ISearchLocal) =>
		getAvatarURL({
			text: getRoomAvatar(item),
			type: item.t,
			userId,
			token,
			server,
			avatarETag: item.avatarETag,
			rid: item.rid,
			blockUnauthenticatedAccess,
			serverVersion
		});

	return (
		<View style={styles.inputContainer}>
			<Text style={[styles.label, { color: colors.fontDefault }]}>{I18n.t('Person_or_channel')}</Text>
			<MultiSelect
				onSearch={getRooms}
				onChange={onRoomSelect}
				options={rooms.map(room => ({
					value: room.rid,
					text: { text: getRoomTitle(room) },
					imageUrl: getAvatar(room)
				}))}
				placeholder={{ text: `${I18n.t('Select')}` }}
				context={BlockContext.FORM}
				multiselect
			/>
		</View>
	);
};

export default SelectPersonOrChannel;
