import React, { forwardRef, useContext, useImperativeHandle } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import { useDispatch } from 'react-redux';

import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import { IComposerInput, IComposerInputProps, IInputSelection } from './interfaces';
import { MessageComposerContext } from './context';
import { userTyping } from '../../actions/room';

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

export const MessageComposerInput = forwardRef<IComposerInput, IComposerInputProps>(({ inputRef }, ref) => {
	const { colors } = useTheme();
	const { setMicOrSend, rid, sharing } = useContext(MessageComposerContext);
	const textRef = React.useRef('');
	const selectionRef = React.useRef<IInputSelection>(defaultSelection);
	const dispatch = useDispatch();

	useImperativeHandle(ref, () => ({
		sendMessage: () => {
			const text = textRef.current;
			setInput('');
			return text;
		}
	}));

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
		debouncedOnChangeText(text);
		setInput(text);
	};

	const onSelectionChange: TextInputProps['onSelectionChange'] = e => {
		selectionRef.current = e.nativeEvent.selection;
	};

	const debouncedOnChangeText = useDebouncedCallback((text: string) => {
		const isTextEmpty = text.length === 0;
		handleTyping(!isTextEmpty);
		if (isTextEmpty) {
			// this.stopTrackingMention();
			console.log('stopTrackingMention');
			return;
		}
		const { start, end } = selectionRef.current;
		console.log('🚀 ~ file: MessageComposerInput.tsx:73 ~ debouncedOnChangeText ~ start, end:', start, end);
	}, 300); // TODO: 300ms?

	const handleTyping = (isTyping: boolean) => {
		if (sharing) {
			return;
		}
		dispatch(userTyping(rid, isTyping));
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
});
