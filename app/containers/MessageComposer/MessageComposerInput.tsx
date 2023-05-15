import React, { useContext } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import { IInputSelection } from './interfaces';
import { MessageComposerContext } from './context';

const styles = StyleSheet.create({
	textInput: {
		maxHeight: 240,
		paddingHorizontal: 16,
		paddingTop: 12,
		// TODO: check glitch on iOS selector pin with several lines
		paddingBottom: 12,
		fontSize: 16,
		// textAlignVertical: 'center',
		...sharedStyles.textRegular
	}
});

const defaultSelection: IInputSelection = { start: 0, end: 0 };

export const MessageComposerInput = () => {
	const { colors } = useTheme();
	const { setMicOrSend } = useContext(MessageComposerContext);
	const textRef = React.useRef('');
	const inputRef = React.useRef<TextInput | null>(null);
	const selectionRef = React.useRef<IInputSelection>(defaultSelection);

	const setInput = (text: string, selection?: IInputSelection) => {
		textRef.current = text;
		if (selection) {
			selectionRef.current = selection;
		}
		if (inputRef.current) {
			inputRef.current.setNativeProps({ text });
		}
	};

	const onChangeText: TextInputProps['onChangeText'] = text => {
		const isTextEmpty = text.length === 0;
		setMicOrSend(!isTextEmpty ? 'send' : 'mic');
		// this.debouncedOnChangeText(text);
		setInput(text);
	};

	const onSelectionChange: TextInputProps['onSelectionChange'] = e => {
		selectionRef.current = e.nativeEvent.selection;
	};

	return (
		<TextInput
			style={[styles.textInput, { color: colors.fontDefault }]}
			placeholder={`Message {ROOM}`}
			placeholderTextColor={colors.fontAnnotation}
			ref={component => (inputRef.current = component)}
			blurOnSubmit={false}
			onChangeText={onChangeText}
			onSelectionChange={onSelectionChange}
			underlineColorAndroid='transparent'
			defaultValue=''
			multiline
			// testID={`messagebox-input${tmid ? '-thread' : ''}`}
			// {...isAndroidTablet}
		/>
	);
};
