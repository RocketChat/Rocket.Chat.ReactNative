import React, { forwardRef, useContext, useEffect, useImperativeHandle } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import { useDispatch } from 'react-redux';

import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import { IComposerInput, IComposerInputProps, IInputSelection, TSetInput } from './interfaces';
import { MessageComposerContext } from './context';
import { userTyping } from '../../actions/room';
import { loadDraftMessage, saveDraftMessage } from './helpers';
import { useSubscription } from './hooks';
import { getRoomTitle } from '../../lib/methods/helpers';

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
	const { setMicOrSend, rid, tmid, editing, sharing } = useContext(MessageComposerContext);
	const textRef = React.useRef('');
	const selectionRef = React.useRef<IInputSelection>(defaultSelection);
	const dispatch = useDispatch();
	const subscription = useSubscription(rid);
	let placeholder = 'Message ';
	if (subscription) {
		placeholder += subscription.t === 'd' ? '@' : '#';
		placeholder += getRoomTitle(subscription);
	}

	useEffect(() => {
		const setDraftMessage = async () => {
			const draftMessage = await loadDraftMessage({ rid, tmid });
			setInput(draftMessage);
		};
		setDraftMessage();

		return () => {
			if (!editing) {
				saveDraftMessage({ rid, tmid, draftMessage: textRef.current });
			}
		};
	}, []);

	useImperativeHandle(ref, () => ({
		sendMessage: () => {
			const text = textRef.current;
			setInput('');
			return text;
		},
		getText: () => textRef.current,
		getSelection: () => selectionRef.current,
		setInput
	}));

	const setInput: TSetInput = (text, selection) => {
		textRef.current = text;
		if (selection) {
			selectionRef.current = selection;
		}
		if (inputRef.current) {
			inputRef.current.setNativeProps({ text });
		}
		setMicOrSend(text.length === 0 ? 'mic' : 'send');
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
		// if (isTextEmpty) {
		// 	// this.stopTrackingMention();
		// 	console.log('stopTrackingMention');
		// 	return;
		// }
		// const { start, end } = selectionRef.current;
		// console.log('🚀 ~ file: MessageComposerInput.tsx:73 ~ debouncedOnChangeText ~ start, end:', start, end);
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
			placeholder={placeholder}
			placeholderTextColor={colors.fontAnnotation}
			ref={component => (inputRef.current = component)}
			blurOnSubmit={false}
			onChangeText={onChangeText}
			onSelectionChange={onSelectionChange}
			underlineColorAndroid='transparent'
			defaultValue=''
			multiline
			testID={`message-composer-input${tmid ? '-thread' : ''}`}
		/>
	);
});
