import { type Ref } from 'react';
import { type Control, Controller } from 'react-hook-form';
import { type TextInput as RNTextInput } from 'react-native';

import { FormTextInput, type IRCTextInputProps } from './FormTextInput';

interface IControlledFormTextInputProps extends Omit<IRCTextInputProps, 'inputRef'> {
	control: Control<any>;
	name: string;
	inputRef?: Ref<RNTextInput>;
}

const setRefValue = (ref: Ref<RNTextInput> | undefined, value: RNTextInput | null) => {
	if (typeof ref === 'function') {
		ref(value);
	} else if (ref && typeof ref === 'object' && 'current' in ref) {
		(ref as { current: RNTextInput | null }).current = value;
	}
};

export const ControlledFormTextInput = ({ control, name, inputRef, ...props }: IControlledFormTextInputProps) => (
	<Controller
		control={control}
		name={name}
		render={({ field: { onChange, value, ref } }) => (
			<FormTextInput
				onChangeText={onChange}
				value={value}
				inputRef={e => {
					setRefValue(ref, e);
					setRefValue(inputRef, e);
				}}
				{...props}
			/>
		)}
	/>
);
