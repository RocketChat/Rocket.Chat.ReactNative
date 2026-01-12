import React from 'react';
import { Text, View } from 'react-native';

import I18n from '../../../i18n';
import { styles } from '../styles';

interface ICallStatusText {
	isOnHold?: boolean;
	isMuted?: boolean;
}

const CallStatusText = ({ isOnHold = false, isMuted = false }: ICallStatusText): React.ReactElement | null => {
	if (!isOnHold && !isMuted) {
		return null;
	}

	const getStatusText = (): React.ReactNode => {
		if (isOnHold && isMuted) {
			return (
				<>
					<Text style={styles.statusText}>{I18n.t('On_hold')}, </Text>
					<Text style={[styles.statusText, styles.statusTextHighlight]}>{I18n.t('Muted')}</Text>
				</>
			);
		}
		if (isOnHold) {
			return <Text style={styles.statusText}>{I18n.t('On_hold')}</Text>;
		}
		if (isMuted) {
			return <Text style={[styles.statusText, styles.statusTextHighlight]}>{I18n.t('Muted')}</Text>;
		}
		return null;
	};

	return <View style={styles.statusTextContainer}>{getStatusText()}</View>;
};

export default CallStatusText;
