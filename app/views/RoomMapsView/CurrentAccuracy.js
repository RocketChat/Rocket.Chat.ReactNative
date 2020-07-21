import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../constants/colors';
import I18n from '../../i18n';
import styles from './styles';

const CurrentAccuracy = React.memo(({
	theme, accuracy
}) => (
    <>
        <Text style={{ color: themes[theme].bodyText, fontWeight: 'bold' }}>{I18n.t('Send_You_Current_Location')}</Text>
        <Text style={{ color: themes[theme].bodyText, ...styles.text }}>{I18n.t('Exactly_To')} {Math.round(accuracy)}m</Text>
    </>
));

export default CurrentAccuracy;

CurrentAccuracy.propTypes = {
	theme: PropTypes.string,
	accuracy: PropTypes.number
};
