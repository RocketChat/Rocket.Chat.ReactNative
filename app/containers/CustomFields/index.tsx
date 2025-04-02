import React from 'react';
import { TextInput } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

import { FormTextInput } from '../TextInput';
import useParsedCustomFields from '../../lib/hooks/useParsedCustomFields';

interface ICustomFields {
	Accounts_CustomFields: string;
	customFields: any;
	onCustomFieldChange: (value: any) => void;
	customFieldsRef: React.MutableRefObject<{
		[key: string]: TextInput | undefined;
	}>;
	onSubmit?: () => void;
}

const CustomFields = ({
	Accounts_CustomFields,
	customFields,
	onCustomFieldChange,
	customFieldsRef,
	onSubmit = () => null
}: ICustomFields) => {
	const { parsedCustomFields } = useParsedCustomFields(Accounts_CustomFields);
	if (!parsedCustomFields) {
		return null;
	}
	try {
		return Object.keys(parsedCustomFields).map((key: string, index: number, array: any) => {
			const handleSubmitEditing = () => {
				if (array.length - 1 > index) {
					const nextKey = array[index + 1];

					customFieldsRef.current[nextKey]?.focus();
					return;
				}
				onSubmit();
			};

			if (parsedCustomFields[key].type === 'select') {
				const options = parsedCustomFields[key]?.options?.map((option: string) => ({ label: option, value: option })) ?? [];
				return (
					<RNPickerSelect
						key={key}
						items={options}
						onValueChange={value => {
							const newValue: { [key: string]: string } = {};
							newValue[key] = value;
							onCustomFieldChange({ ...customFields, ...newValue });
						}}
						onDonePress={() => {
							setTimeout(() => {
								handleSubmitEditing();
							}, 200);
						}}
						value={customFields[key]}>
						<FormTextInput
							required={parsedCustomFields[key]?.required}
							label={key}
							value={customFields[key]}
							testID='settings-view-language'
						/>
					</RNPickerSelect>
				);
			}
			return (
				<FormTextInput
					inputRef={(ref: any) => {
						customFieldsRef.current[key] = ref;
					}}
					key={key}
					label={key}
					value={customFields[key]}
					onChangeText={value => {
						const newValue: { [key: string]: string } = {};
						newValue[key] = value;
						onCustomFieldChange({ ...customFields, ...newValue });
					}}
					onSubmitEditing={handleSubmitEditing}
					required={parsedCustomFields[key]?.required}
					maxLength={parsedCustomFields[key]?.maxLength ?? undefined}
					containerStyle={{ marginBottom: 0, marginTop: 0 }}
				/>
			);
		});
	} catch (error) {
		return null;
	}
};

export default CustomFields;
