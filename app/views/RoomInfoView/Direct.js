import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import I18n from '../../i18n';
import Item from './Item';
import Timezone from './Timezone';
import CustomFields from './CustomFields';

import styles from './styles';

const Roles = ({ roles, theme, user }) => (roles && roles.length ? (
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
	theme: PropTypes.string,
	user: PropTypes.object,
};

const Bio = ({ bio, theme }) => bio != null ? (
	<Item
		label={'Bio'}
		content={bio}
		theme={theme}
	/>
) 
: (null);
Bio.propTypes = {
	bio: PropTypes.string,
	theme: PropTypes.string
};

const Direct = ({ roomUser, theme, user }) => { 
	const isAdmin = ['admin', 'livechat-manager'].find(role => user.roles.includes(role)) !== undefined;

	return (
	<>
		<Bio bio={roomUser.bio} theme={theme} />
		{isAdmin && (<Roles roles={roomUser.parsedRoles} theme={theme} user={user} />)}
		<CustomFields customFields={roomUser.customFields} user={roomUser} currentUser={user} theme={theme} />
	</>
)};
Direct.propTypes = {
	roomUser: PropTypes.object,
	theme: PropTypes.string
};

export default Direct;
