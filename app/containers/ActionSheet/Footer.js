import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../../i18n';
import Button from '../Button';
import styles from './styles';
import { themes } from '../../constants/colors';

const Footer = ({ hide, theme }) => (
	<View style={styles.footer}>
		<Button
			title={I18n.t('Cancel')}
			onPress={hide}
			type='secondary'
			theme={theme}
			backgroundColor={themes[theme].auxiliaryBackground}
		/>
	</View>
);
Footer.propTypes = {
	hide: PropTypes.func,
	theme: PropTypes.string
};

export default Footer;
