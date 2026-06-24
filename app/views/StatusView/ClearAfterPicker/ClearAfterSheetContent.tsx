import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState, Fragment, type ReactElement } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useActionSheet } from '../../../containers/ActionSheet';
import * as List from '../../../containers/List';
import { isAndroid } from '../../../lib/methods/helpers';
import { useTheme } from '../../../theme';
import DatePickerSheetContent from './DatePickerSheetContent';
import styles from './styles';
import { CLEAR_AFTER_OPTIONS, type ClearAfterValue } from './types';

interface IClearAfterSheetContentProps {
	initialValue: ClearAfterValue;
	initialDate: Date | null;
	onConfirm: (value: ClearAfterValue, date: Date | null) => void;
}

const ClearAfterSheetContent = ({ initialValue, initialDate, onConfirm }: IClearAfterSheetContentProps): ReactElement => {
	'use memo';

	const [pendingValue, setPendingValue] = useState<ClearAfterValue>(initialValue);
	const { colors } = useTheme();
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const pendingDate = initialDate ?? new Date();

	const openAndroidDateTimePicker = (baseDate: Date) => {
		DateTimePickerAndroid.open({
			value: baseDate,
			mode: 'date',
			minimumDate: new Date(),
			onChange: (dateEvent, selectedDate) => {
				if (dateEvent.type !== 'set' || !selectedDate) {
					setPendingValue(initialValue);
					return;
				}
				DateTimePickerAndroid.open({
					value: selectedDate,
					mode: 'time',
					onChange: (timeEvent, finalDate) => {
						if (timeEvent.type === 'set' && finalDate) {
							onConfirm('custom', finalDate);
							hideActionSheet();
						} else {
							setPendingValue(initialValue);
						}
					}
				});
			}
		});
	};

	const handleRadioPress = (value: ClearAfterValue) => {
		setPendingValue(value);
		if (value === 'custom') {
			if (isAndroid) {
				openAndroidDateTimePicker(pendingDate);
			} else {
				showActionSheet({
					children: <DatePickerSheetContent initialDate={pendingDate} onConfirm={date => onConfirm('custom', date)} />
				});
			}
		} else {
			onConfirm(value, null);
			hideActionSheet();
		}
	};

	return (
		<View style={[localStyles.container, { backgroundColor: colors.surfaceRoom }]}>
			<List.Separator />
			{CLEAR_AFTER_OPTIONS.map(option => (
				<Fragment key={option.value}>
					<List.Radio
						title={option.labelKey}
						isSelected={pendingValue === option.value}
						value={option.value}
						onPress={() => handleRadioPress(option.value)}
						style={styles.pickerItem}
						testID={`status-clear-after-${option.value || 'never'}`}
					/>
					<List.Separator />
				</Fragment>
			))}
		</View>
	);
};

const localStyles = StyleSheet.create((_theme, rt) => ({
	container: {
		marginBottom: rt.insets.bottom
	}
}));

export default ClearAfterSheetContent;
