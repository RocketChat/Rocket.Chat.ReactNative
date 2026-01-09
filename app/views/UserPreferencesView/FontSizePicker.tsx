import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { type TActionSheetOptionsItem, useActionSheet } from '../../containers/ActionSheet';
import { CustomIcon } from '../../containers/CustomIcon';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { FONT_SIZE_PREFERENCES_KEY } from '../../lib/constants/keys';
import { FONT_SIZE_OPTIONS, useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { useUserPreferences } from '../../lib/methods/userPreferences';

const styles = StyleSheet.create({
	title: { ...sharedStyles.textRegular, fontSize: 16 }
});

const FONT_SIZE_LABELS = {
	[FONT_SIZE_OPTIONS.SMALL]: 'Small',
	[FONT_SIZE_OPTIONS.NORMAL]: 'Normal',
	[FONT_SIZE_OPTIONS.LARGE]: 'Large',
	[FONT_SIZE_OPTIONS.EXTRA_LARGE]: 'Extra_Large'
};

const FONT_SIZE_OPTIONS_ARRAY = [
	{ label: FONT_SIZE_LABELS[FONT_SIZE_OPTIONS.SMALL], value: FONT_SIZE_OPTIONS.SMALL.toString() },
	{ label: FONT_SIZE_LABELS[FONT_SIZE_OPTIONS.NORMAL], value: FONT_SIZE_OPTIONS.NORMAL.toString() },
	{ label: FONT_SIZE_LABELS[FONT_SIZE_OPTIONS.LARGE], value: FONT_SIZE_OPTIONS.LARGE.toString() },
	{ label: FONT_SIZE_LABELS[FONT_SIZE_OPTIONS.EXTRA_LARGE], value: FONT_SIZE_OPTIONS.EXTRA_LARGE.toString() }
];

interface IFontSizePickerProps {
	title: string;
	testID: string;
}

const FontSizePicker = ({ title, testID }: IFontSizePickerProps) => {
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	const [fontSize, setFontSize] = useUserPreferences<string>(FONT_SIZE_PREFERENCES_KEY, FONT_SIZE_OPTIONS.NORMAL.toString());

	// Derive option from fontSize directly instead of using state
	const option = FONT_SIZE_OPTIONS_ARRAY.find(opt => opt.value === fontSize) || FONT_SIZE_OPTIONS_ARRAY[1];

	const handleFontSizeChange = (value: string) => {
		setFontSize(value);
	};

	const getOptions = (): TActionSheetOptionsItem[] =>
		FONT_SIZE_OPTIONS_ARRAY.map(i => ({
			title: I18n.t(i.label, { defaultValue: i.label }),
			onPress: () => {
				hideActionSheet();
				handleFontSizeChange(i.value);
			},
			right: option?.value === i.value ? () => <CustomIcon name={'check'} size={20} color={colors.fontHint} /> : undefined
		}));

	const label = option?.label ? I18n.t(option?.label, { defaultValue: option?.label }) : option?.label;

	return (
		<List.Item
			title={title}
			testID={testID}
			onPress={() => showActionSheet({ options: getOptions() })}
			right={() => <Text style={[styles.title, { color: colors.fontHint, fontSize: scaleFontSize(16) }]}>{label}</Text>}
			additionalAccessibilityLabel={label}
		/>
	);
};

export default FontSizePicker;
