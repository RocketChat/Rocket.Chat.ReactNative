import { type ReactElement } from 'react';
import { Text } from 'react-native';

import { useActionSheet } from '~/containers/ActionSheet';
import * as List from '~/containers/List';
import { useIsNativeList } from '~/containers/List/native/context';
import I18n from '~/i18n';
import dayjs from '~/lib/dayjs';
import { isIOS26OrLater } from '~/lib/methods/helpers/deviceInfo';
import { useTheme } from '~/theme';
import ClearAfterRow from './ClearAfterRow';
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
	const { showActionSheet } = useActionSheet();
	const { colors } = useTheme();
	const isNativeList = useIsNativeList();
	const customDateLabel = customDate ? dayjs(customDate).format('LL LT') : null;

	const getDisplayLabel = (): string => {
		if (value === 'custom' && customDateLabel) {
			return customDateLabel;
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

	const item = (
		<List.Item
			title='Status_clear_after'
			testID='status-view-clear-after'
			onPress={handlePress}
			right={() => <Text style={[styles.pickerText, { color: colors.fontInfo }]}>{getDisplayLabel()}</Text>}
			additionalAccessibilityLabel={getDisplayLabel()}
			style={styles.listItem}
		/>
	);

	const row = isIOS26OrLater ? (
		<ClearAfterRow value={value} customDate={customDate} customDateLabel={customDateLabel} onChange={onChange}>
			{item}
		</ClearAfterRow>
	) : (
		item
	);

	if (isNativeList) {
		return (
			<List.Section>
				{row}
				<List.Info info='Status_clear_after_hint' />
			</List.Section>
		);
	}

	return (
		<>
			{row}
			<List.Separator />
			<List.Info info='Status_clear_after_hint' />
		</>
	);
};

export default ClearAfterPicker;
