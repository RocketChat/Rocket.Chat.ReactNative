import React from 'react';
import { Text, View } from 'react-native';

import { themes } from '../../lib/constants';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import Timezone from './Timezone';
import CustomFields from './CustomFields';
import styles from './styles';
import { IUserParsed } from '.';

const Roles = ({ roles }: { roles?: string[] }) => {
	const { theme } = useTheme();

	if (roles && roles.length) {
		<View style={styles.item}>
			<Text style={[styles.itemLabel, { color: themes[theme].titleText }]}>{I18n.t('Roles')}</Text>
			<View style={styles.rolesContainer}>
				{roles.map(role =>
					role ? (
						<View style={[styles.roleBadge, { backgroundColor: themes[theme].chatComponentBackground }]} key={role}>
							<Text style={[styles.role, { color: themes[theme].titleText }]}>{role}</Text>
						</View>
					) : null
				)}
			</View>
		</View>;
	}

	return null;
};

const Direct = ({ roomUser }: { roomUser: IUserParsed }) => (
	<>
		<Roles roles={roomUser.parsedRoles} />
		<Timezone utcOffset={roomUser.utcOffset} />
		<CustomFields customFields={roomUser.customFields} />
	</>
);

export default Direct;
