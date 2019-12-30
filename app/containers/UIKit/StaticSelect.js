import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import RNPickerSelect from 'react-native-picker-select';

import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { extractText } from './utils';

const styles = StyleSheet.create({
	viewContainer: {
		padding: 16,
		borderWidth: 2,
		borderRadius: 2,
		justifyContent: 'center'
	},
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});

export const StaticSelect = ({
	options,
	onChange,
	theme = 'light'
}) => {
	const items = options.map(option => ({ label: extractText(option.text), value: option.value }));
	return (
		<RNPickerSelect
			items={items}
			placeholder={{}}
			useNativeAndroidPickerStyle={false}
			onValueChange={value => onChange({ value })}
			style={{ viewContainer: { ...styles.viewContainer, borderColor: themes[theme].auxiliaryTintColor } }}
			Icon={() => <CustomIcon size={22} name='arrow-down' color={themes[theme].auxiliaryText} />}
			textInputProps={{ style: { ...styles.pickerText, color: themes[theme].auxiliaryText } }}
		/>
	);
};
StaticSelect.propTypes = {
	options: PropTypes.array,
	onChange: PropTypes.func,
	theme: PropTypes.string
};
