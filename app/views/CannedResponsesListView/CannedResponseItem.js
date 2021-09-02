import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import Touchable from 'react-native-platform-touchable';
import { themes } from '../../constants/colors';
import styles from './styles';
import Button from '../../containers/Button';
import { CustomIcon } from '../../lib/Icons';
import I18n from '../../i18n';

const CannedResponseItem = ({ theme }) => (
	<Touchable onPress={() => {}} style={[styles.wrapCannedItem, { backgroundColor: themes[theme].messageboxBackground }]}>
		<>
			<View style={styles.cannedRow}>
				<View style={styles.cannedWrapShortcutScope}>
					<Text style={[styles.cannedShortcut, { color: themes[theme].titleText }]}>!welcomes</Text>
					<Text style={[styles.cannedScope, { color: themes[theme].auxiliaryTintColor }]}>Public</Text>
				</View>

				<Button
					title={I18n.t('Use')}
					fontSize={12}
					color={themes[theme].titleText}
					style={[styles.cannedUseButton, { backgroundColor: themes[theme].headerBackground }]}
					theme={theme}
				/>

				<CustomIcon
					name='chevron-right'
					color={themes[theme].auxiliaryText}
					size={20}
				/>

			</View>

			<Text style={[styles.cannedText, { color: themes[theme].auxiliaryTintColor }]}>“Buenos Dias! Welcome to Rocket.Chat. What can I help you with today?”</Text>

			<View style={styles.cannedTagContainer}>
				<View style={[styles.cannedTagWrap, { backgroundColor: themes[theme].searchboxBackground }]}>
					<Text style={[styles.cannedTag, { color: themes[theme].auxiliaryTintColor }]}>sales</Text>
				</View>
			</View>
		</>
	</Touchable>
);

CannedResponseItem.propTypes = {
	theme: PropTypes.string
};

export default CannedResponseItem;
