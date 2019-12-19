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
		borderWidth: 1,
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
			Icon={() => <CustomIcon size={22} name='arrow-down' />}
			textInputProps={{ style: { ...styles.pickerText, color: themes[theme].actionTintColor } }}
		/>
	);
};
StaticSelect.propTypes = {
	options: PropTypes.array,
	onChange: PropTypes.func,
	theme: PropTypes.string
};

// export const MultiStaticSelect = ({
//   options,
//   onChange,
//   parser,
//   placeholder = { text: 'select a option' },
// }) => (
//   <MultiSelect
//     options={options.map((option) => [option.value, parser.text(option.text)])}
//     onChange={(value) => onChange({ target: { value } })}
//     placeholder={parser.text(placeholder)} />);
