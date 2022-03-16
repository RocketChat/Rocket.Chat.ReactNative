import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Touchable from 'react-native-platform-touchable';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';
import moment from 'moment';

import Button from '../Button';
import { textParser } from './utils';
import { themes } from '../../constants/colors';
import sharedStyles from '../../views/Styles';
import { CustomIcon } from '../../lib/Icons';
import { isAndroid } from '../../utils/deviceInfo';
import ActivityIndicator from '../ActivityIndicator';
import { IDatePicker } from './interfaces';

const styles = StyleSheet.create({
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
	},
	loading: {
		padding: 0
	}
});

export const DatePicker = ({ element, language, action, context, theme, loading, value, error }: IDatePicker) => {
	const [show, onShow] = useState(false);
	const initial_date = element?.initial_date;
	const placeholder = element?.placeholder;

	const [currentDate, onChangeDate] = useState(new Date(initial_date || value));

	const onChange = ({ nativeEvent: { timestamp } }: any, date: any) => {
		const newDate = date || new Date(timestamp);
		onChangeDate(newDate);
		action({ value: moment(newDate).format('YYYY-MM-DD') });
		if (isAndroid) {
			onShow(false);
		}
	};

	let button = <Button title={textParser([placeholder])} onPress={() => onShow(!show)} loading={loading} theme={theme} />;

	if (context === BLOCK_CONTEXT.FORM) {
		button = (
			<Touchable
				onPress={() => onShow(!show)}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				background={Touchable.Ripple(themes[theme].bannerBackground)}>
				<View style={[styles.input, { borderColor: error ? themes[theme].dangerColor : themes[theme].separatorColor }]}>
					<Text style={[styles.inputText, { color: error ? themes[theme].dangerColor : themes[theme].titleText }]}>
						{currentDate.toLocaleDateString(language)}
					</Text>
					{loading ? (
						<ActivityIndicator style={[styles.loading, styles.icon]} />
					) : (
						<CustomIcon
							name='calendar'
							size={20}
							color={error ? themes[theme].dangerColor : themes[theme].auxiliaryText}
							style={styles.icon}
						/>
					)}
				</View>
			</Touchable>
		);
	}

	const content = show ? (
		<DateTimePicker mode='date' display='default' value={currentDate} onChange={onChange} textColor={themes[theme].titleText} />
	) : null;

	return (
		<>
			{button}
			{content}
		</>
	);
};
