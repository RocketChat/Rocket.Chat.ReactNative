import { useActionSheet } from '~/containers/ActionSheet';
import { asNativeListRow } from '~/containers/List/nativeListRow';
import NativeListPicker from '~/containers/List/NativeListPicker';
import I18n from '~/i18n';
import DatePickerSheetContent from './DatePickerSheetContent';
import { CLEAR_AFTER_OPTIONS, type ClearAfterValue } from './types';

interface IClearAfterNativeRowProps {
	value: ClearAfterValue;
	customDate: Date | null;
	customDateLabel: string | null;
	onChange: (value: ClearAfterValue, date: Date | null) => void;
}

const isClearAfterValue = (value: string): value is ClearAfterValue => CLEAR_AFTER_OPTIONS.some(option => option.value === value);

const ClearAfterNativeRow = ({ value, customDate, customDateLabel, onChange }: IClearAfterNativeRowProps) => {
	const { showActionSheet } = useActionSheet();

	const options = CLEAR_AFTER_OPTIONS.map(option => ({
		label: option.value === 'custom' && customDateLabel ? customDateLabel : I18n.t(option.labelKey),
		value: option.value,
		testID: `status-clear-after-${option.value || 'never'}`
	}));

	const handleSelectionChange = (selected: string) => {
		if (!isClearAfterValue(selected)) {
			return;
		}
		if (selected === 'custom') {
			showActionSheet({
				children: <DatePickerSheetContent initialDate={customDate ?? new Date()} onConfirm={date => onChange('custom', date)} />
			});
			return;
		}
		onChange(selected, null);
	};

	return (
		<NativeListPicker
			title={I18n.t('Status_clear_after')}
			testID='status-view-clear-after'
			options={options}
			selection={value === 'custom' && !customDate ? '' : value}
			onSelectionChange={handleSelectionChange}
		/>
	);
};

export default asNativeListRow(ClearAfterNativeRow);
