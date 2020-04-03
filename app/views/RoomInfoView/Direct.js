import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import _ from 'lodash';

import RocketChat from '../../lib/rocketchat';
import database from '../../lib/database';
import { themes } from '../../constants/colors';
import I18n from '../../i18n';

import Timezone from './Timezone';
import CustomFields from './CustomFields';

import styles from './styles';

const Roles = ({ roles, theme }) => (roles && roles.length ? (
	<View style={styles.item}>
		<Text style={[styles.itemLabel, { color: themes[theme].titleText }]}>{I18n.t('Roles')}</Text>
		<View style={styles.rolesContainer}>
			{roles.map(role => (role ? (
				<View style={[styles.roleBadge, { backgroundColor: themes[theme].auxiliaryBackground }]} key={role}>
					<Text style={styles.role}>{role}</Text>
				</View>
			) : null))}
		</View>
	</View>
) : null);
Roles.propTypes = {
	roles: PropTypes.array,
	theme: PropTypes.string
};

const Direct = ({ room, theme, initial }) => {
	const [user, setUser] = useState(initial || {});

	const getRoleDescription = async(id) => {
		const db = database.active;
		try {
			const rolesCollection = db.collections.get('roles');
			const role = await rolesCollection.find(id);
			if (role) {
				return role.description;
			}
			return null;
		} catch (e) {
			return null;
		}
	};

	const getUserInfo = async() => {
		if (_.isEmpty(user)) {
			try {
				const roomUserId = RocketChat.getUidDirectMessage(room);
				const result = await RocketChat.getUserInfo(roomUserId);
				if (result.success) {
					let { roles } = result.user;
					if (roles && roles.length) {
						roles = await Promise.all(roles.map(async(role) => {
							const description = await getRoleDescription(role);
							return description;
						}));
					}
					setUser(result.user);
				}
			} catch {
				// do nothing
			}
		}
	};

	useEffect(() => { getUserInfo(); }, []);

	return (
		<>
			<Roles roles={user.roles} theme={theme} />
			<Timezone utcOffset={user.utcOffset} theme={theme} />
			<CustomFields customFields={user.customFields} theme={theme} />
		</>
	);
};
Direct.propTypes = {
	room: PropTypes.object,
	theme: PropTypes.string,
	initial: PropTypes.object
};

export default Direct;
