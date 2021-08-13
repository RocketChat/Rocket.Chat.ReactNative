import React, { useState } from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';
import { Q } from '@nozbe/watermelondb';

import debounce from '../../utils/debounce';
import { avatarURL } from '../../utils/avatar';
import RocketChat from '../../lib/rocketchat';
import database from '../../lib/database';
import I18n from '../../i18n';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';

import styles from './styles';
import { themes } from '../../constants/colors';

const SelectUsers = ({
	server, token, userId, selected, onUserSelect, blockUnauthenticatedAccess, serverVersion, theme
}) => {
	const [users, setUsers] = useState([]);

	const getUsers = debounce(async(keyword = '') => {
		try {
			const db = database.active;
			const usersCollection = db.get('users');
			const res = await RocketChat.search({ text: keyword, filterRooms: false });
			let items = [...users.filter(u => selected.includes(u.name)), ...res.filter(r => !users.find(u => u.name === r.name))];
			const records = await usersCollection.query(Q.where('username', Q.oneOf(items.map(u => u.name)))).fetch();
			items = items.map((item) => {
				const index = records.findIndex(r => r.username === item.name);
				if (index > -1) {
					const record = records[index];
					return {
						uids: item.uids,
						usernames: item.usernames,
						prid: item.prid,
						fname: item.fname,
						name: item.name,
						avatarETag: record.avatarETag
					};
				}
				return item;
			});
			setUsers(items);
		} catch {
			// do nothing
		}
	}, 300);

	const getAvatar = item => avatarURL({
		text: RocketChat.getRoomAvatar(item),
		type: 'd',
		user: { id: userId, token },
		server,
		avatarETag: item.avatarETag,
		blockUnauthenticatedAccess,
		serverVersion
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
					imageUrl: getAvatar(user)
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
	blockUnauthenticatedAccess: PropTypes.bool,
	serverVersion: PropTypes.string,
	theme: PropTypes.string
};

export default SelectUsers;
