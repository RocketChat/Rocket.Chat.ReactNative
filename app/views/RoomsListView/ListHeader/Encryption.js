import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { BorderlessButton } from 'react-native-gesture-handler';

import { withTheme } from '../../../theme';
import { CustomIcon } from '../../../lib/Icons';
import { themes } from '../../../constants/colors';
import I18n from '../../../i18n';
import styles from '../styles';

const Encryption = React.memo(({
	searching,
	goEncryption,
	showEncryption,
	theme
}) => {
	if (searching > 0 || !showEncryption) {
		return null;
	}
	// TODO: Check e2e is enabled | check if random password exists
	return (
		<BorderlessButton style={[styles.encryptionButton, { backgroundColor: themes[theme].actionTintColor }]} theme={theme} onPress={goEncryption}>
			<CustomIcon name='encrypted' size={24} color={themes[theme].buttonText} style={styles.encryptionIcon} />
			<Text style={[styles.encryptionText, { color: themes[theme].buttonText }]}>{I18n.t('Save_Your_Encryption_Password')}</Text>
		</BorderlessButton>
	);
});

Encryption.propTypes = {
	searching: PropTypes.bool,
	goEncryption: PropTypes.func,
	showEncryption: PropTypes.bool,
	theme: PropTypes.string
};

export default withTheme(Encryption);
