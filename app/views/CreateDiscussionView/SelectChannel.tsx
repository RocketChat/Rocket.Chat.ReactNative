import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import { ISearchLocal } from '../../definitions';
import I18n from '../../i18n';
import { getAvatarURL } from '../../lib/methods/helpers/getAvatarUrl';
import { ICreateDiscussionViewSelectChannel } from './interfaces';
import styles from './styles';
import { localSearchSubscription } from '../../lib/methods';
import { getRoomAvatar, getRoomTitle } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';

const SelectChannel = ({
	server,
	token,
	userId,
	onChannelSelect,
	initial,
	blockUnauthenticatedAccess,
	serverVersion
}: ICreateDiscussionViewSelectChannel): React.ReactElement => {
	const [channels, setChannels] = useState<ISearchLocal[]>([]);
	const { colors } = useTheme();

	const getChannels = async (keyword = '') => {
		try {
			const res = (await localSearchSubscription({ text: keyword, filterUsers: false })) as ISearchLocal[];
			setChannels(res);
			return res.map(channel => ({
				value: channel,
				text: { text: getRoomTitle(channel) },
				imageUrl: getAvatar(channel)
			}));
		} catch {
			// do nothing
		}
	};

	useEffect(() => {
		getChannels('');
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
		<View accessibilityLabel={`${I18n.t('Parent_channel_or_group')}, ${I18n.t('Required')}`}>
			<Text style={[styles.label, { color: colors.fontTitlesLabels }]}>
				{I18n.t('Parent_channel_or_group')}{' '}
				<Text style={[styles.required, { color: colors.fontSecondaryInfo }]}>({I18n.t('Required')})</Text>
			</Text>
			<MultiSelect
				inputStyle={styles.inputStyle}
				onChange={onChannelSelect}
				onSearch={getChannels}
				value={initial && [initial]}
				disabled={!!initial}
				options={channels.map(channel => ({
					value: channel,
					text: { text: getRoomTitle(channel) },
					imageUrl: getAvatar(channel)
				}))}
				onClose={() => getChannels('')}
				placeholder={{ text: I18n.t('Select_a_Channel') }}
			/>
		</View>
	);
};

export default SelectChannel;
