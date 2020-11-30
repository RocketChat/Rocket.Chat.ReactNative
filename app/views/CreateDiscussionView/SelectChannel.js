import React, { useState } from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import debounce from '../../utils/debounce';
import { avatarURL } from '../../utils/avatar';
import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import { themes } from '../../constants/colors';

import styles from './styles';

const SelectChannel = ({
	server, token, userId, onChannelSelect, initial, blockUnauthenticatedAccess, serverVersion, theme
}) => {
	const [channels, setChannels] = useState([]);

	const getChannels = debounce(async(keyword = '') => {
		try {
			const res = await RocketChat.search({ text: keyword, filterUsers: false });
			setChannels(res);
		} catch {
			// do nothing
		}
	}, 300);

	const getAvatar = item => avatarURL({
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
					value: channel.rid,
					text: { text: RocketChat.getRoomTitle(channel) },
					imageUrl: getAvatar(channel)
				}))}
				onClose={() => setChannels([])}
				placeholder={{ text: `${ I18n.t('Select_a_Channel') }...` }}
			/>
		</>
	);
};
SelectChannel.propTypes = {
	server: PropTypes.string,
	token: PropTypes.string,
	userId: PropTypes.string,
	initial: PropTypes.object,
	onChannelSelect: PropTypes.func,
	blockUnauthenticatedAccess: PropTypes.bool,
	serverVersion: PropTypes.string,
	theme: PropTypes.string
};

export default SelectChannel;
