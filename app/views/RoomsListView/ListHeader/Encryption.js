import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { BorderlessButton } from 'react-native-gesture-handler';

import { withTheme } from '../../../theme';
import { CustomIcon } from '../../../lib/Icons';
import { themes } from '../../../constants/colors';
import I18n from '../../../i18n';
import styles from '../styles';
import { E2E_BANNER_TYPE } from '../../../lib/encryption/constants';

const Encryption = React.memo(({
	searching,
	goEncryption,
	encryptionBanner,
	theme
}) => {
	if (searching > 0 || !encryptionBanner) {
		return null;
	}

	let text = I18n.t('Save_Your_Encryption_Password');
	if (encryptionBanner === E2E_BANNER_TYPE.REQUEST_PASSWORD) {
		text = I18n.t('Enter_Your_E2E_Password');
	}

	return (
		<BorderlessButton
			style={[styles.encryptionButton, { backgroundColor: themes[theme].actionTintColor }]}
			theme={theme}
			onPress={goEncryption}
			testID='listheader-encryption'
			accessibilityLabel={text}
		>
			<CustomIcon name='encrypted' size={24} color={themes[theme].buttonText} style={styles.encryptionIcon} />
			<Text style={[styles.encryptionText, { color: themes[theme].buttonText }]}>{text}</Text>
		</BorderlessButton>
	);
});

Encryption.propTypes = {
	searching: PropTypes.bool,
	goEncryption: PropTypes.func,
	encryptionBanner: PropTypes.string,
	theme: PropTypes.string
};

export default withTheme(Encryption);
