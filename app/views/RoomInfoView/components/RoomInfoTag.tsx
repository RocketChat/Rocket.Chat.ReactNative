import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '../../../theme';
import styles from '../styles';
import { CustomIcon } from '../../../containers/CustomIcon';
import type { TIconsName } from '../../../containers/CustomIcon';

export const RoomInfoTag = ({ name, icon, testID }: { name: string; icon?: TIconsName; testID?: string }) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.roleBadge, { backgroundColor: colors.surfaceSelected }]} testID={testID}>
			{icon ? <CustomIcon name={icon} size={16} /> : null}
			<Text style={[styles.role, { color: colors.buttonFontSecondary }]}>{name}</Text>
		</View>
	);
};

export const RoomInfoTagContainer = ({ children }: { children: ReactNode }) => (
	<View style={styles.rolesContainer}>{children}</View>
);
