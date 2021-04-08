import React from 'react';
import RNPickerSelect from 'react-native-picker-select';
import RCTextInput from '../../../containers/TextInput';

const CustomField = ({
	Accounts_CustomFields, theme, customFields, setState
}) => {
	if (!Accounts_CustomFields) {
		return null;
	}
	try {
		const parsedCustomFields = JSON.parse(Accounts_CustomFields);
		return Object.keys(parsedCustomFields).map((key) => {
			if (parsedCustomFields[key].type === 'select') {
				const options = parsedCustomFields[key].options.map(option => ({ label: option, value: option }));
				return (
					<RNPickerSelect
						key={key}
						items={options}
						onValueChange={(value) => {
							const newValue = {};
							newValue[key] = value;
							setState({ customFields: { ...customFields, ...newValue } });
						}}
						value={customFields[key]}
					>
						<RCTextInput
							label={key}
							placeholder={key}
							value={customFields[key]}
							testID='settings-view-language'
							theme={theme}
						/>
					</RNPickerSelect>
				);
			}

			return (
				<RCTextInput
					key={key}
					label={key}
					placeholder={key}
					value={customFields[key]}
					onChangeText={(value) => {
						const newValue = {};
						newValue[key] = value;
						this.setState({ customFields: { ...customFields, ...newValue } });
					}}
					theme={theme}
				/>
			);
		});
	} catch (error) {
		return null;
	}
};

export default CustomField;
