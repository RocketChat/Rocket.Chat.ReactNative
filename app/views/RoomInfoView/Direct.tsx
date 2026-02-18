import React from 'react';
import { Text, View } from 'react-native';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import CustomFields from './CustomFields';
import Timezone from './Timezone';
import styles from './styles';
import { type IUser } from '../../definitions';
import { RoomInfoTag, RoomInfoTagContainer } from './components/RoomInfoTag';

const Roles = ({ roles }: { roles?: string[] }) => {
	const { colors } = useTheme();

	if (roles?.length) {
		return (
			<View style={styles.item} testID='user-roles'>
				<Text style={[styles.itemLabel, { color: colors.fontTitlesLabels }]}>{I18n.t('Roles')}</Text>
				<RoomInfoTagContainer>
					{roles.map(role =>
						role ? <RoomInfoTag name={role} key={role} testID={`user-role-${role.replace(/ /g, '-')}`} /> : null
					)}
				</RoomInfoTagContainer>
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
