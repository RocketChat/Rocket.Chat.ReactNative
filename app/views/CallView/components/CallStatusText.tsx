import React from 'react';
import { Text } from 'react-native';

import I18n from '../../../i18n';
import { styles } from '../styles';
import { useCallControls } from '../../../lib/services/voip/useCallStore';
import { useTheme } from '../../../theme';

const CallStatusText = (): React.ReactElement => {
	'use memo';

	const { isMuted, isOnHold } = useCallControls();
	const { colors } = useTheme();

	if (isOnHold && isMuted) {
		return (
			<>
				<Text style={[styles.statusText, { color: colors.fontDefault }]}>
					{I18n.t('On_hold')}, <Text style={{ color: colors.statusFontWarning }}>{I18n.t('Muted')}</Text>
				</Text>
			</>
		);
	}
	if (isOnHold) {
		return <Text style={[styles.statusText, { color: colors.fontDefault }]}>{I18n.t('On_hold')}</Text>;
	}
	if (isMuted) {
		return <Text style={[styles.statusText, { color: colors.statusFontWarning }]}>{I18n.t('Muted')}</Text>;
	}

	return <Text style={styles.statusText}>&nbsp;</Text>;
};

export default CallStatusText;
