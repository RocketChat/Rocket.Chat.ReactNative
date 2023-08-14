import React from 'react';
import { Text, View } from 'react-native';

import { IUserParsed } from '.';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import CustomFields from './CustomFields';
import Timezone from './Timezone';
import styles from './styles';

const Roles = ({ roles }: { roles?: string[] }) => {
	const { colors } = useTheme();

	if (roles?.length) {
		return (
			<View style={styles.item}>
				<Text testID='user-roles' style={[styles.itemLabel, { color: colors.titleText }]}>
					{I18n.t('Roles')}
				</Text>
				<View style={styles.rolesContainer}>
					{roles.map(role =>
						role ? (
							<View
								testID={`user-role-${role.replace(/ /g, '-')}`}
								style={[styles.roleBadge, { backgroundColor: colors.chatComponentBackground }]}
								key={role}
							>
								<Text style={[styles.role, { color: colors.titleText }]}>{role}</Text>
							</View>
						) : null
					)}
				</View>
			</View>
		);
	}

	return null;
};

const Direct = ({ roomUser }: { roomUser: IUserParsed }): React.ReactElement => (
	<>
		<Roles roles={roomUser.parsedRoles} />
		<Timezone utcOffset={roomUser.utcOffset} />
		<CustomFields customFields={roomUser.customFields} />
	</>
);

export default Direct;
