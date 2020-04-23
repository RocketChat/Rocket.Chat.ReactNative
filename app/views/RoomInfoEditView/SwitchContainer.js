import React from 'react';
import { View, Text, Switch } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';

const SwitchContainer = React.memo(({
	children, value, disabled, onValueChange, leftLabelPrimary, leftLabelSecondary, rightLabelPrimary, rightLabelSecondary, theme, testID, labelContainerStyle, leftLabelStyle
}) => (
	<>
		<View key='switch-container' style={[styles.switchContainer, children && styles.switchMargin]}>
			{leftLabelPrimary && (
				<View style={[styles.switchLabelContainer, labelContainerStyle]}>
					<Text style={[styles.switchLabelPrimary, { color: themes[theme].titleText }, leftLabelStyle]}>{leftLabelPrimary}</Text>
					<Text style={[styles.switchLabelSecondary, { color: themes[theme].titleText }, leftLabelStyle]}>{leftLabelSecondary}</Text>
				</View>
			)}
			<Switch
				style={styles.switch}
				onValueChange={onValueChange}
				value={value}
				disabled={disabled}
				trackColor={SWITCH_TRACK_COLOR}
				testID={testID}
			/>
			{rightLabelPrimary && (
				<View style={[styles.switchLabelContainer, labelContainerStyle]}>
					<Text style={[styles.switchLabelPrimary, { color: themes[theme].titleText }, leftLabelStyle]}>{rightLabelPrimary}</Text>
					<Text style={[styles.switchLabelSecondary, { color: themes[theme].titleText }, leftLabelStyle]}>{rightLabelSecondary}</Text>
				</View>
			)}
		</View>
		{children}
		<View key='switch-divider' style={[styles.divider, { borderColor: themes[theme].separatorColor }]} />
	</>
));

SwitchContainer.propTypes = {
	value: PropTypes.bool,
	disabled: PropTypes.bool,
	leftLabelPrimary: PropTypes.string,
	leftLabelSecondary: PropTypes.string,
	rightLabelPrimary: PropTypes.string,
	rightLabelSecondary: PropTypes.string,
	onValueChange: PropTypes.func,
	theme: PropTypes.string,
	testID: PropTypes.string,
	labelContainerStyle: PropTypes.object,
	leftLabelStyle: PropTypes.object,
	children: PropTypes.any
};

export default SwitchContainer;
