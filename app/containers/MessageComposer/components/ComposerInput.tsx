import React, { forwardRef, useContext, useEffect, useImperativeHandle } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import { useDispatch } from 'react-redux';

import { IComposerInput, IComposerInputProps, IInputSelection, TSetInput } from '../interfaces';
import { MessageComposerContext } from '../context';
import { loadDraftMessage, saveDraftMessage } from '../helpers';
import { useSubscription } from '../hooks';
import sharedStyles from '../../../views/Styles';
import { useTheme } from '../../../theme';
import { userTyping } from '../../../actions/room';
import { getRoomTitle } from '../../../lib/methods/helpers';
import { MIN_HEIGHT } from '../constants';

const styles = StyleSheet.create({
	textInput: {
		flex: 1,
		minHeight: MIN_HEIGHT,
		maxHeight: 200,
		paddingTop: 12,
		// TODO: check glitch on iOS selector pin with several lines
		paddingBottom: 12,
		fontSize: 16,
		textAlignVertical: 'center',
		...sharedStyles.textRegular,
		lineHeight: 22
	}
});

const defaultSelection: IInputSelection = { start: 0, end: 0 };

export const ComposerInput = forwardRef<IComposerInput, IComposerInputProps>(({ inputRef }, ref) => {
	const { colors, theme } = useTheme();
	const {
		rid,
		tmid,
		editing,
		sharing,
		setFocused,
		setMicOrSend,
		setTrackingViewHeight,
		setAutocompleteType,
		setAutocompleteText
	} = useContext(MessageComposerContext);
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
		setInput,
		focus
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

	const focus = () => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	const onFocus: TextInputProps['onFocus'] = () => {
		setFocused(true);
	};

	const onBlur: TextInputProps['onBlur'] = () => {
		setFocused(false);
	};

	const stopAutocomplete = () => {
		setAutocompleteType(null);
		setAutocompleteText('');
	};

	const debouncedOnChangeText = useDebouncedCallback(async (text: string) => {
		const isTextEmpty = text.length === 0;
		handleTyping(!isTextEmpty);
		if (isTextEmpty) {
			stopAutocomplete();
			return;
		}
		const { start, end } = selectionRef.current;
		const cursor = Math.max(start, end);
		const whiteSpaceOrBreakLineRegex = /[\s\n]+/;
		const txt =
			cursor < text.length ? text.substr(0, cursor).split(whiteSpaceOrBreakLineRegex) : text.split(whiteSpaceOrBreakLineRegex);
		const lastWord = txt[txt.length - 1];
		const autocompleteText = lastWord.substring(1);

		if (!lastWord) {
			return;
		}
		if (text.match(/^\//)) {
			// TODO: reducer?
			setAutocompleteType('/');
			setAutocompleteText(autocompleteText);
			return;
		}
		if (lastWord.match(/^#/)) {
			setAutocompleteType('#');
			setAutocompleteText(autocompleteText);
			return;
		}
		if (lastWord.match(/^@/)) {
			setAutocompleteType('@');
			setAutocompleteText(autocompleteText);
			return;
		}
		if (lastWord.match(/^:/)) {
			setAutocompleteType(':');
			setAutocompleteText(autocompleteText);
			return;
		}
		if (lastWord.match(/^!/)) {
			setAutocompleteType('!');
			setAutocompleteText(autocompleteText);
			return;
		}

		stopAutocomplete();
	}, 300); // TODO: 300ms?

	const handleTyping = (isTyping: boolean) => {
		if (sharing) {
			return;
		}
		dispatch(userTyping(rid, isTyping));
	};

	const handleLayout = (e: any) => {
		console.log(e.nativeEvent.layout.height);
		setTrackingViewHeight(e.nativeEvent.layout.height);
	};

	return (
		<TextInput
			onLayout={handleLayout}
			style={[styles.textInput, { color: colors.fontDefault }]}
			placeholder={placeholder}
			placeholderTextColor={colors.fontAnnotation}
			ref={component => (inputRef.current = component)}
			blurOnSubmit={false}
			onChangeText={onChangeText}
			onSelectionChange={onSelectionChange}
			onFocus={onFocus}
			onBlur={onBlur}
			underlineColorAndroid='transparent'
			defaultValue=''
			multiline
			keyboardAppearance={theme === 'light' ? 'light' : 'dark'}
			testID={`message-composer-input${tmid ? '-thread' : ''}`}
		/>
	);
});
