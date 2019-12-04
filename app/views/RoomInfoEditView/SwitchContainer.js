import React from 'react';
import { View, Text, Switch } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { SWITCH_TRACK_COLOR, themes } from '../../constants/colors';

export default class SwitchContainer extends React.PureComponent {
	static propTypes = {
		value: PropTypes.bool,
		disabled: PropTypes.bool,
		leftLabelPrimary: PropTypes.string,
		leftLabelSecondary: PropTypes.string,
		rightLabelPrimary: PropTypes.string,
		rightLabelSecondary: PropTypes.string,
		onValueChange: PropTypes.func,
		theme: PropTypes.string,
		testID: PropTypes.string
	}

	render() {
		const {
			value, disabled, onValueChange, leftLabelPrimary, leftLabelSecondary, rightLabelPrimary, rightLabelSecondary, theme, testID
		} = this.props;
		return (
			[
				<View key='switch-container' style={styles.switchContainer}>
					<View style={styles.switchLabelContainer}>
						<Text style={[styles.switchLabelPrimary, { color: themes[theme].titleText }]}>{leftLabelPrimary}</Text>
						<Text style={[styles.switchLabelSecondary, { color: themes[theme].titleText }]}>{leftLabelSecondary}</Text>
					</View>
					<Switch
						style={styles.switch}
						onValueChange={onValueChange}
						value={value}
						disabled={disabled}
						trackColor={SWITCH_TRACK_COLOR}
						testID={testID}
					/>
					<View style={styles.switchLabelContainer}>
						<Text style={[styles.switchLabelPrimary, { color: themes[theme].titleText }]}>{rightLabelPrimary}</Text>
						<Text style={[styles.switchLabelSecondary, { color: themes[theme].titleText }]}>{rightLabelSecondary}</Text>
					</View>
				</View>,
				<View key='switch-divider' style={[styles.divider, { borderColor: themes[theme].separatorColor }]} />
			]
		);
	}
}
