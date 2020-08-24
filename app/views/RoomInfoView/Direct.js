import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

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

const Direct = ({ roomUser, theme }) => (
	<>
		<Roles roles={roomUser.parsedRoles} theme={theme} />
		<Timezone utcOffset={roomUser.utcOffset} theme={theme} />
		<CustomFields customFields={roomUser.customFields} theme={theme} />
	</>
);
Direct.propTypes = {
	roomUser: PropTypes.object,
	theme: PropTypes.string
};

export default Direct;
