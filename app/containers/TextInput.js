import React from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import PropTypes from 'prop-types';

import sharedStyles from '../views/Styles';
import { COLOR_DANGER } from '../constants/colors';

const styles = StyleSheet.create({
	inputContainer: {
		marginBottom: 20
	},
	label: {
		marginBottom: 4,
		fontSize: 16
	},
	input: {
		paddingTop: 12,
		paddingBottom: 12,
		paddingHorizontal: 10,
		borderWidth: 2,
		borderRadius: 2,
		backgroundColor: 'white',
		borderColor: 'rgba(0,0,0,.15)',
		color: 'black'
	},
	labelError: {
		color: COLOR_DANGER
	},
	inputError: {
		color: COLOR_DANGER,
		borderColor: COLOR_DANGER
	}
});

export default class RCTextInput extends React.PureComponent {
	static propTypes = {
		label: PropTypes.string,
		value: PropTypes.string,
		error: PropTypes.object,
		inputProps: PropTypes.object,
		inputRef: PropTypes.func,
		onChangeText: PropTypes.func,
		onSubmitEditing: PropTypes.func
	}

	static defaultProps = {
		label: 'Label',
		error: {}
	}

	render() {
		const {
			label, value, error, inputRef, onChangeText, onSubmitEditing, inputProps
		} = this.props;
		return (
			<View style={styles.inputContainer}>
				<Text style={[styles.label, error.error && styles.labelError]}>
					{label}
				</Text>
				<TextInput
					ref={inputRef}
					style={[styles.input, error.error && styles.inputError]}
					onChangeText={onChangeText}
					onSubmitEditing={onSubmitEditing}
					value={value}
					autoCorrect={false}
					returnKeyType='next'
					autoCapitalize='none'
					underlineColorAndroid='transparent'
					{...inputProps}
				/>
				{error.error && <Text style={sharedStyles.error}>{error.reason}</Text>}
			</View>
		);
	}
}
