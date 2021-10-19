import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import I18n from '../../i18n';

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

const Bio = ({ bio, theme }) => (bio != null ? (
	<View style={{ paddingLeft: 30, paddingRight: 30 }}>
		<Text style={{ fontSize: 28, paddingLeft: 30 }}>About</Text>
		<Text style={
			{
				color: themes[theme].auxiliaryText,
				padding: 20,
				fontSize: 16
			}
		}
		>
			{bio}
		</Text>
		<View />
	</View>
)
	: null);
Bio.propTypes = {
	bio: PropTypes.string,
	theme: PropTypes.string
};

const Direct = ({ roomUser, theme }) => (roomUser.bio ? (
	<>
		<Bio bio={roomUser.bio} theme={theme} />
	</>
) : (
	<>
	</>
));
Direct.propTypes = {
	roomUser: PropTypes.object,
	theme: PropTypes.string,
	user: PropTypes.shape({
		roles: PropTypes.array
	})
};

export default Direct;
