import React, { useState } from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import debounce from '../../utils/debounce';
import { avatarURL } from '../../utils/avatar';
import RocketChat from '../../lib/rocketchat';
import I18n from '../../i18n';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';

import styles from './styles';
import { themes } from '../../constants/colors';

const SelectUsers = ({
	server, token, userId, selected, onUserSelect, theme
}) => {
	const [users, setUsers] = useState([]);

	const getUsers = debounce(async(keyword = '') => {
		try {
			const res = await RocketChat.search({ text: keyword, filterRooms: false });
			setUsers([...users.filter(u => selected.includes(u.name)), ...res.filter(r => !users.find(u => u.name === r.name))]);
		} catch {
			// do nothing
		}
	}, 300);

	const getAvatar = text => avatarURL({
		text, type: 'd', userId, token, baseUrl: server
	});

	return (
		<>
			<Text style={[styles.label, { color: themes[theme].titleText }]}>{I18n.t('Invite_users')}</Text>
			<MultiSelect
				theme={theme}
				inputStyle={styles.inputStyle}
				onSearch={getUsers}
				onChange={onUserSelect}
				options={users.map(user => ({
					value: user.name,
					text: { text: RocketChat.getRoomTitle(user) },
					imageUrl: getAvatar(RocketChat.getRoomAvatar(user))
				}))}
				onClose={() => setUsers(users.filter(u => selected.includes(u.name)))}
				placeholder={{ text: `${ I18n.t('Select_Users') }...` }}
				context={BLOCK_CONTEXT.FORM}
				multiselect
			/>
		</>
	);
};
SelectUsers.propTypes = {
	server: PropTypes.string,
	token: PropTypes.string,
	userId: PropTypes.string,
	selected: PropTypes.array,
	onUserSelect: PropTypes.func,
	theme: PropTypes.string
};

export default SelectUsers;
