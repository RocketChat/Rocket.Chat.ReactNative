import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { PADDING_HORIZONTAL } from './constants';
import I18n from '../../i18n';

const styles = StyleSheet.create({
	container: {
		paddingTop: 8,
		paddingHorizontal: PADDING_HORIZONTAL
	},
	text: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

const ListInfo = React.memo(({ info, translateInfo, theme }) => (
	<View style={styles.container}>
		<Text style={[styles.text, { color: themes[theme].infoText }]}>{translateInfo ? I18n.t(info) : info}</Text>
	</View>
));

ListInfo.propTypes = {
	info: PropTypes.string,
	theme: PropTypes.string,
	translateInfo: PropTypes.bool
};

ListInfo.defaultProps = {
	translateInfo: true
};

ListInfo.displayName = 'List.Info';

export default withTheme(ListInfo);
