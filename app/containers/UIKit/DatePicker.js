import React, { useState } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import DateTimePicker from '@react-native-community/datetimepicker';

import Button from '../Button';
import { extractText } from './utils';
import { defaultTheme } from '../../utils/theme';
import { themes } from '../../constants/colors';

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	modal: {
		height: 260,
		width: '100%'
	}
});

export const DatePicker = ({ element, action, theme = 'light' }) => {
	const [show, onShow] = useState(false);
	const { initial_date, placeholder } = element;

	const onChange = ({ nativeEvent: { timestamp } }) => {
		const date = new Date(timestamp);
		date.setHours(0);
		action({ value: date.toJSON().slice(0, 10) });
	};

	return (
		<>
			<Button
				title={extractText(placeholder)}
				onPress={() => onShow(!show)}
				theme={theme}
			/>
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
	theme: PropTypes.string
};
