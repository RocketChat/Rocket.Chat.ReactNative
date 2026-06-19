import { type ReactElement } from 'react';
import { Text } from 'react-native';

import { useActionSheet } from '../../../containers/ActionSheet';
import * as List from '../../../containers/List';
import I18n from '../../../i18n';
import dayjs from '../../../lib/dayjs';
import { useTheme } from '../../../theme';
import ClearAfterSheetContent from './ClearAfterSheetContent';
import styles from './styles';
import { CLEAR_AFTER_OPTIONS, type ClearAfterValue } from './types';

export type { ClearAfterValue };
export { computeExpiresAt, getInitialClearAfterState } from './helpers';

interface IClearAfterPickerProps {
	value: ClearAfterValue;
	customDate: Date | null;
	onChange: (value: ClearAfterValue, date: Date | null) => void;
}

const ClearAfterPicker = ({ value, customDate, onChange }: IClearAfterPickerProps): ReactElement => {
	'use memo';
	const { showActionSheet } = useActionSheet();
	const { colors } = useTheme();

	const getDisplayLabel = (): string => {
		if (value === 'custom' && customDate) {
			return dayjs(customDate).format('LL LT');
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
