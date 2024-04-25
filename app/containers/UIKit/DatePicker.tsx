import React, { useState } from 'react';
import { StyleSheet, Text, unstable_batchedUpdates, View } from 'react-native';
import DateTimePicker, { BaseProps } from '@react-native-community/datetimepicker';
import Touchable from 'react-native-platform-touchable';
import { BlockContext } from '@rocket.chat/ui-kit';
import moment from 'moment';

import Button from '../Button';
import { textParser } from './utils';
import { themes } from '../../lib/constants';
import sharedStyles from '../../views/Styles';
import { CustomIcon } from '../CustomIcon';
import { isAndroid } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';
import ActivityIndicator from '../ActivityIndicator';
import { IDatePicker } from './interfaces';

const styles = StyleSheet.create({
	input: {
		height: 48,
		paddingLeft: 16,
		borderWidth: 1,
		borderRadius: 4,
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

export const DatePicker = ({ element, language, action, context, loading, value, error }: IDatePicker) => {
	const { theme } = useTheme();
	const [show, onShow] = useState(false);
	const initial_date = element?.initial_date;
	const placeholder = element?.placeholder;

	const [currentDate, onChangeDate] = useState(new Date(initial_date || value));

	const onChange: BaseProps['onChange'] = ({ nativeEvent: { timestamp } }, date?) => {
		if (date || timestamp) {
			const newDate = date || new Date(timestamp);
			unstable_batchedUpdates(() => {
				onChangeDate(newDate);
				if (isAndroid) {
					onShow(false);
				}
			});
			action({ value: moment(newDate).format('YYYY-MM-DD') });
		}
	};

	let button = placeholder ? <Button title={textParser([placeholder])} onPress={() => onShow(!show)} loading={loading} /> : null;

	if (context === BlockContext.FORM) {
		button = (
			<Touchable
				onPress={() => onShow(!show)}
				style={{ backgroundColor: themes[theme].surfaceRoom }}
				background={Touchable.Ripple(themes[theme].surfaceNeutral)}
			>
				<View
					style={[styles.input, { borderColor: error ? themes[theme].buttonBackgroundDangerDefault : themes[theme].strokeLight }]}
				>
					<Text style={[styles.inputText, { color: error ? themes[theme].fontDanger : themes[theme].fontTitlesLabels }]}>
						{currentDate.toLocaleDateString(language)}
					</Text>
					{loading ? (
						<ActivityIndicator style={[styles.loading, styles.icon]} />
					) : (
						<CustomIcon
							name='calendar'
							size={20}
							color={error ? themes[theme].buttonBackgroundDangerDefault : themes[theme].fontSecondaryInfo}
							style={styles.icon}
						/>
					)}
				</View>
			</Touchable>
		);
	}

	const content = show ? (
		<DateTimePicker
			mode='date'
			display={isAndroid ? 'default' : 'inline'}
			value={currentDate}
			onChange={onChange}
			textColor={themes[theme].fontTitlesLabels}
		/>
	) : null;

	return (
		<>
			{button}
			{content}
		</>
	);
};
