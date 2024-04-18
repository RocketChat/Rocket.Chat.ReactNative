import React from 'react';
import { Text, View } from 'react-native';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import CustomFields from './CustomFields';
import Timezone from './Timezone';
import styles from './styles';
import { IUser } from '../../definitions';

const Roles = ({ roles }: { roles?: string[] }) => {
	const { colors } = useTheme();

	if (roles?.length) {
		return (
			<View style={styles.item} testID='user-roles'>
				<Text style={[styles.itemLabel, { color: colors.fontTitlesLabels }]}>{I18n.t('Roles')}</Text>
				<View style={styles.rolesContainer}>
					{roles.map(role =>
						role ? (
							<View
								style={[styles.roleBadge, { backgroundColor: colors.surfaceSelected }]}
								key={role}
								testID={`user-role-${role.replace(/ /g, '-')}`}
							>
								<Text style={[styles.role, { color: colors.fontTitlesLabels }]}>{role}</Text>
							</View>
						) : null
					)}
				</View>
			</View>
		);
	}

	return null;
};

const Direct = ({ roomUser }: { roomUser: IUser }): React.ReactElement => (
	<>
		<Roles roles={roomUser.roles} />
		<Timezone utcOffset={roomUser.utcOffset} />
		<CustomFields customFields={roomUser.customFields} />
	</>
);

export default Direct;
