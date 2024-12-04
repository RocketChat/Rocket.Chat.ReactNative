import React from 'react';
import RNPickerSelect from 'react-native-picker-select';

import { FormTextInput } from '../../../../containers/TextInput';

interface ICustomFields {
	Accounts_CustomFields: string;
	customFields: any;
	onCustomFieldChange: (value: any) => void;
}

const CustomFields = ({ Accounts_CustomFields, customFields, onCustomFieldChange }: ICustomFields) => {
	if (!Accounts_CustomFields) {
		return null;
	}
	try {
		const parsedCustomFields = JSON.parse(Accounts_CustomFields);
		return Object.keys(parsedCustomFields).map((key: string, index: number, array: any) => {
			if (parsedCustomFields[key].type === 'select') {
				const options = parsedCustomFields[key].options.map((option: string) => ({ label: option, value: option }));
				return (
					<RNPickerSelect
						key={key}
						items={options}
						onValueChange={value => {
							const newValue: { [key: string]: string } = {};
							newValue[key] = value;
							onCustomFieldChange({ ...customFields, ...newValue });
						}}
						value={customFields[key]}>
						<FormTextInput
							inputRef={e => {
								// @ts-ignore
								this[key] = e;
							}}
							label={key}
							placeholder={key}
							value={customFields[key]}
							testID='settings-view-language'
						/>
					</RNPickerSelect>
				);
			}

			return (
				<FormTextInput
					inputRef={e => {
						// @ts-ignore
						this[key] = e;
					}}
					key={key}
					label={key}
					placeholder={key}
					value={customFields[key]}
					onChangeText={value => {
						const newValue: { [key: string]: string } = {};
						newValue[key] = value;
						onCustomFieldChange({ ...customFields, ...newValue });
					}}
					onSubmitEditing={() => {
						if (array.length - 1 > index) {
							// @ts-ignore
							return this[array[index + 1]].focus();
						}
					}}
					containerStyle={{ marginBottom: 0, marginTop: 0 }}
				/>
			);
		});
	} catch (error) {
		return null;
	}
};

export default CustomFields;
