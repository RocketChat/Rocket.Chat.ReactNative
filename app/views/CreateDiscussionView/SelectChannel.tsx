import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

import debounce from '../../utils/debounce';
import { avatarURL } from '../../utils/avatar';
import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import { themes } from '../../constants/colors';
import { TSubscriptionModel } from '../../definitions/ISubscription';
import styles from './styles';
import { ICreateDiscussionViewSelectChannel } from './interfaces';

const SelectChannel = ({
	server,
	token,
	userId,
	onChannelSelect,
	initial,
	blockUnauthenticatedAccess,
	serverVersion,
	theme
}: ICreateDiscussionViewSelectChannel): JSX.Element => {
	const [channels, setChannels] = useState<TSubscriptionModel[]>([]);
	// console.log(initial);

	const getChannels = debounce(async (keyword = '') => {
		try {
			const res = await RocketChat.localSearch({ text: keyword, filterUsers: false });
			setChannels(res);
		} catch {
			// do nothing
		}
	}, 300);

	useEffect(() => {
		getChannels('');
	}, []);

	const getAvatar = (item: any) =>
		avatarURL({
			text: RocketChat.getRoomAvatar(item),
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
				theme={theme}
				inputStyle={styles.inputStyle}
				onChange={onChannelSelect}
				onSearch={getChannels}
				value={initial && [initial]}
				disabled={initial}
				options={channels.map(channel => ({
					value: channel,
					text: { text: RocketChat.getRoomTitle(channel) },
					imageUrl: getAvatar(channel)
				}))}
				placeholder={{ text: `${I18n.t('Select_a_Channel')}...` }}
			/>
		</>
	);
};

export default SelectChannel;
