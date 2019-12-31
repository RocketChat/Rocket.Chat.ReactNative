import React, { useState } from 'react';
import {
	View, Modal, StyleSheet, Text
} from 'react-native';
import PropTypes from 'prop-types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import Button from '../Button';
import { extractText } from './utils';
import { defaultTheme } from '../../utils/theme';
import { themes } from '../../constants/colors';

import sharedStyles from '../../views/Styles';
import { CustomIcon } from '../../lib/Icons';
import { isIOS, isAndroid } from '../../utils/deviceInfo';
import Touch from '../../utils/touch';

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
		fontSize: 14
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
		if (isAndroid) {
			onShow(false);
		}
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
			<Touch
				onPress={() => onShow(!show)}
				theme={theme}
			>
				<View style={[styles.input, { borderColor: themes[theme].separatorColor }]}>
					<Text
						style={[
							styles.inputText,
							{ color: themes[theme].titleText }
						]}
					>
						{new Date(initial_date).toLocaleDateString('en-US')}
					</Text>
					<CustomIcon name='calendar' size={20} color={themes[theme].auxiliaryText} style={styles.icon} />
				</View>
			</Touch>
		);
	}

	let content = show ? (
		<DateTimePicker
			mode='date'
			display='default'
			value={new Date(initial_date)}
			onChange={onChange}
		/>
	) : null;

	if (isIOS) {
		content = (
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
						{content}
					</View>
				</View>
			</Modal>
		);
	}

	return (
		<>
			{button}
			{content}
		</>
	);
};
DatePicker.propTypes = {
	element: PropTypes.object,
	action: PropTypes.func,
	context: PropTypes.number,
	theme: PropTypes.string
};
