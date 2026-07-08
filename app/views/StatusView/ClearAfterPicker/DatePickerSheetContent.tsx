import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, type ReactElement } from 'react';
import { View } from 'react-native';

import { useActionSheet } from '../../../containers/ActionSheet';
import Button from '../../../containers/Button';
import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import styles from './styles';

interface IDatePickerSheetContentProps {
	initialDate: Date;
	onConfirm: (date: Date) => void;
}

const DatePickerSheetContent = ({ initialDate, onConfirm }: IDatePickerSheetContentProps): ReactElement => {
	'use memo';

	const [pendingDate, setPendingDate] = useState<Date>(initialDate);
	const { colors } = useTheme();
	const { hideActionSheet } = useActionSheet();

	return (
		<View style={[styles.datePickerContainer, { backgroundColor: colors.surfaceRoom }]}>
			<DateTimePicker
				mode='datetime'
				display='inline'
				value={pendingDate}
				minimumDate={new Date()}
				onChange={(_event, date) => {
					if (date) setPendingDate(date);
				}}
			/>
			<View style={styles.buttonContainer}>
				<Button
					title={I18n.t('Confirm')}
					onPress={() => {
						onConfirm(pendingDate);
						hideActionSheet();
					}}
					testID='status-clear-after-confirm'
					style={styles.confirmButton}
				/>
			</View>
		</View>
	);
};

export default DatePickerSheetContent;
