import React from 'react';
import { Text, View } from 'react-native';

import AvatarContainer from '../../../containers/Avatar';
import I18n from '../../../i18n';
import { useCallContact } from '../../../lib/services/voip/useCallStore';
import { styles } from '../styles';
import { useTheme } from '../../../theme';

const CallerInfo = (): React.ReactElement => {
	const { colors } = useTheme();
	const contact = useCallContact();

	const name = contact.displayName || contact.username || I18n.t('Unknown');
	const avatarText = contact.username || name;

	return (
		<View style={styles.callerInfoContainer} testID='caller-info'>
			<View style={styles.avatarContainer}>
				<AvatarContainer text={avatarText} size={120} borderRadius={2} />
			</View>
			<View style={styles.callerRow}>
				<Text style={[styles.caller, { color: colors.fontDefault }]} numberOfLines={1} testID='caller-info-name'>
					{name}
				</Text>
			</View>
		</View>
	);
};

export default CallerInfo;
