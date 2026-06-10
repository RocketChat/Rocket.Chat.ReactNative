import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useActionSheet } from '../../containers/ActionSheet';
import Button from '../../containers/Button';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import { isAndroid } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';

export type ClearAfterValue = '' | '30' | '60' | 'custom';

const CLEAR_AFTER_OPTIONS: { value: ClearAfterValue; labelKey: string }[] = [
	{ value: '', labelKey: 'Status_dont_clear' },
	{ value: '30', labelKey: 'Status_30_minutes' },
	{ value: '60', labelKey: 'Status_1_hour' },
	{ value: 'custom', labelKey: 'Status_choose_date_and_time' }
];

export const computeExpiresAt = (value: ClearAfterValue, customDate: Date | null): string | null | undefined => {
	if (value === '') return null;
	if (value === '30') return new Date(Date.now() + 30 * 60_000).toISOString();
	if (value === '60') return new Date(Date.now() + 60 * 60_000).toISOString();
	if (value === 'custom' && customDate) return customDate.toISOString();
	return undefined;
};

const styles = StyleSheet.create({
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	pickerItem: {
		height: 48
	},
	confirmButton: {
		marginHorizontal: 16,
		marginTop: 8
	}
});

interface IClearAfterSheetContentProps {
	initialValue: ClearAfterValue;
	initialDate: Date | null;
	onConfirm: (value: ClearAfterValue, date: Date | null) => void;
}

interface IDatePickerSheetContentProps {
	initialDate: Date;
	onConfirm: (date: Date) => void;
}

const DatePickerSheetContent = ({ initialDate, onConfirm }: IDatePickerSheetContentProps) => {
	const [pendingDate, setPendingDate] = useState<Date>(initialDate);
	const { colors } = useTheme();
	const { hideActionSheet } = useActionSheet();
	const insets = useSafeAreaInsets();

	return (
		<View
			style={{
				backgroundColor: colors.surfaceRoom,
				marginBottom: insets.bottom,
				justifyContent: 'center',
				alignItems: 'center'
			}}>
			<DateTimePicker
				mode='datetime'
				display='inline'
				value={pendingDate}
				minimumDate={new Date()}
				onChange={(_event, date) => {
					if (date) setPendingDate(date);
				}}
			/>
			<View style={styles.confirmButton}>
				<Button
					title={I18n.t('Confirm')}
					onPress={() => {
						onConfirm(pendingDate);
						hideActionSheet();
					}}
					testID='status-clear-after-confirm'
				/>
			</View>
		</View>
	);
};

const ClearAfterSheetContent = ({ initialValue, initialDate, onConfirm }: IClearAfterSheetContentProps) => {
	const [pendingValue, setPendingValue] = useState<ClearAfterValue>(initialValue);
	const [pendingDate] = useState<Date>(initialDate ?? new Date());
	const { colors } = useTheme();
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const insets = useSafeAreaInsets();

	const openAndroidDateTimePicker = (baseDate: Date) => {
		DateTimePickerAndroid.open({
			value: baseDate,
			mode: 'date',
			minimumDate: new Date(),
			onChange: (dateEvent, selectedDate) => {
				if (dateEvent.type !== 'set' || !selectedDate) {
					setPendingValue('');
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
							setPendingValue('');
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
		<View style={{ backgroundColor: colors.surfaceRoom, marginBottom: insets.bottom }}>
			<List.Separator />
			{CLEAR_AFTER_OPTIONS.map(option => (
				<React.Fragment key={option.value}>
					<List.Radio
						title={option.labelKey}
						isSelected={pendingValue === option.value}
						value={option.value}
						onPress={() => handleRadioPress(option.value)}
						style={styles.pickerItem}
						testID={`status-clear-after-${option.value || 'never'}`}
					/>
					<List.Separator />
				</React.Fragment>
			))}
		</View>
	);
};

interface IClearAfterPickerProps {
	value: ClearAfterValue;
	customDate: Date | null;
	onChange: (value: ClearAfterValue, date: Date | null) => void;
}

const ClearAfterPicker = ({ value, customDate, onChange }: IClearAfterPickerProps): React.ReactElement => {
	const { showActionSheet } = useActionSheet();
	const { colors } = useTheme();

	const getDisplayLabel = (): string => {
		if (value === 'custom' && customDate) {
			return customDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
		}
		if (value === 'custom' && !customDate) {
			return I18n.t('Status_dont_clear');
		}
		const option = CLEAR_AFTER_OPTIONS.find(o => o.value === value);
		return option ? I18n.t(option.labelKey) : I18n.t('Status_dont_clear');
	};

	const handlePress = () => {
		showActionSheet({
			children: <ClearAfterSheetContent initialValue={value} initialDate={customDate} onConfirm={onChange} />
		});
	};

	return (
		<>
			<List.Item
				title='Status_clear_after'
				testID='status-view-clear-after'
				onPress={handlePress}
				right={() => <Text style={[styles.pickerText, { color: colors.fontInfo }]}>{getDisplayLabel()}</Text>}
				additionalAccessibilityLabel={getDisplayLabel()}
				style={{ marginTop: 36 }}
			/>
			<List.Separator />
			<List.Info info='Status_clear_after_hint' />
		</>
	);
};

export default ClearAfterPicker;
