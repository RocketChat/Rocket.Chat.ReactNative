import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DateTimePicker from '@react-native-community/datetimepicker';

import Button from '../Button';
import { extractText } from './utils';

export const DatePicker = ({ element, action }) => {
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
				theme='light'
			/>
			{
				show && (
					<DateTimePicker
						mode='date'
						display='default'
						value={new Date(initial_date)}
						onChange={onChange}
					/>
				)
			}
		</>
	);
};
DatePicker.propTypes = {
	element: PropTypes.object,
	action: PropTypes.func
};
