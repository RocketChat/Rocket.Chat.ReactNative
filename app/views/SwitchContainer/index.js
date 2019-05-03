import React from 'react';
import { View, Text, Switch } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import sharedStyles from '../Styles';

export default class SwitchContainer extends React.PureComponent {
	static propTypes = {
		value: PropTypes.bool,
		disabled: PropTypes.bool,
		leftLabelPrimary: PropTypes.string,
		leftLabelSecondary: PropTypes.string,
		rightLabelPrimary: PropTypes.string,
		rightLabelSecondary: PropTypes.string,
		onValueChange: PropTypes.func,
		testID: PropTypes.string
	}

	render() {
		const {
			value, disabled, onValueChange, leftLabelPrimary, leftLabelSecondary, rightLabelPrimary, rightLabelSecondary, testID
		} = this.props;
		return (
			[
				<View key='switch-container' style={styles.switchContainer}>
					<View style={[styles.switchLabelContainer, sharedStyles.alignItemsFlexEnd]}>
						<Text style={styles.switchLabelPrimary}>{leftLabelPrimary}</Text>
						<Text style={[styles.switchLabelSecondary, sharedStyles.textAlignRight]}>{leftLabelSecondary}</Text>
					</View>
					<Switch
						style={styles.switch}
						onValueChange={onValueChange}
						value={value}
						disabled={disabled}
						testID={testID}
					/>
					<View style={styles.switchLabelContainer}>
						<Text style={styles.switchLabelPrimary}>{rightLabelPrimary}</Text>
						<Text style={styles.switchLabelSecondary}>{rightLabelSecondary}</Text>
					</View>
				</View>,
				<View key='switch-divider' style={styles.divider} />
			]
		);
	}
}
