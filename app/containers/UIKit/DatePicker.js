import React, { useState } from 'react';
import {
	View, Modal, StyleSheet, Text
} from 'react-native';
import PropTypes from 'prop-types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';
import { RectButton } from 'react-native-gesture-handler';

import Button from '../Button';
import { extractText } from './utils';
import { defaultTheme } from '../../utils/theme';
import { themes } from '../../constants/colors';

import sharedStyles from '../../views/Styles';
import { CustomIcon } from '../../lib/Icons';

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	modal: {
		height: 260,
		width: '100%'
	},
	input: {
		height: 48,
		paddingLeft: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 2,
		alignItems: 'center',
		flexDirection: 'row'
	},
	inputText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	icon: {
		right: 16,
		position: 'absolute'
	}
});

export const DatePicker = ({
	element, action, context, theme = 'light'
}) => {
	const [show, onShow] = useState(false);
	const { initial_date, placeholder } = element;

	const onChange = ({ nativeEvent: { timestamp } }) => {
		const date = new Date(timestamp);
		date.setHours(0);
		action({ value: date.toJSON().slice(0, 10) });
	};

	let button = (
		<Button
			title={extractText(placeholder)}
			onPress={() => onShow(!show)}
			theme={theme}
		/>
	);

	if (context === BLOCK_CONTEXT.FORM) {
		button = (
			<RectButton
				style={[
					styles.input,
					{
						backgroundColor: themes[theme].backgroundColor,
						borderColor: themes[theme].separatorColor
					}
				]}
				onPress={() => onShow(!show)}
			>
				<Text
					style={[
						styles.inputText,
						{ color: themes[theme].titleText }
					]}
				>
					{new Date(initial_date).toLocaleDateString('en-US')}
				</Text>
				<CustomIcon name='calendar' size={20} color={themes[theme].auxiliaryText} style={styles.icon} />
			</RectButton>
		);
	}

	return (
		<>
			{button}
			<Modal
				animationType='slide'
				transparent
				visible={show}
				onRequestClose={() => onShow(false)}
			>
				<View style={[styles.overlay, { backgroundColor: `${ themes[theme].backdropColor }30` }]}>
					{/* unfortunately we can't change datepicker text color, then we use background based on system theme */}
					<View style={[styles.modal, { backgroundColor: themes[defaultTheme()].backgroundColor }]}>
						<Button
							title='done'
							onPress={() => onShow(false)}
							theme={theme}
							style={{ margin: 0 }}
						/>
						<DateTimePicker
							mode='date'
							display='default'
							value={new Date(initial_date)}
							onChange={onChange}
						/>
					</View>
				</View>
			</Modal>
		</>
	);
};
DatePicker.propTypes = {
	element: PropTypes.object,
	action: PropTypes.func,
	context: PropTypes.number,
	theme: PropTypes.string
};
