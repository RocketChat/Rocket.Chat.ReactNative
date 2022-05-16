import React, { useState } from 'react';
import { Text } from 'react-native';

import { themes } from '../../lib/constants';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import { ISearchLocal } from '../../definitions';
import I18n from '../../i18n';
import { avatarURL } from '../../utils/avatar';
import debounce from '../../utils/debounce';
import { ICreateDiscussionViewSelectChannel } from './interfaces';
import styles from './styles';
import { getRoomAvatar, getRoomTitle, localSearch } from '../../lib/methods';

const SelectChannel = ({
	server,
	token,
	userId,
	onChannelSelect,
	initial,
	blockUnauthenticatedAccess,
	serverVersion,
	theme
}: ICreateDiscussionViewSelectChannel): React.ReactElement => {
	const [channels, setChannels] = useState<ISearchLocal[]>([]);

	const getChannels = debounce(async (keyword = '') => {
		try {
			const res = await localSearch({ text: keyword });
			setChannels(res);
		} catch {
			// do nothing
		}
	}, 300);

	const getAvatar = (item: ISearchLocal) =>
		avatarURL({
			text: getRoomAvatar(item),
			type: item.t,
			user: { id: userId, token },
			server,
			avatarETag: item.avatarETag,
			rid: item.rid,
			blockUnauthenticatedAccess,
			serverVersion
		});

	return (
		<>
			<Text style={[styles.label, { color: themes[theme].titleText }]}>{I18n.t('Parent_channel_or_group')}</Text>
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
				onClose={() => setChannels([])}
				placeholder={{ text: `${I18n.t('Select_a_Channel')}...` }}
			/>
		</>
	);
};

export default SelectChannel;
