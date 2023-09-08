import React, { forwardRef, memo, useEffect, useImperativeHandle } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import { useDispatch } from 'react-redux';

import { IComposerInput, IComposerInputProps, IInputSelection, TSetInput } from '../interfaces';
import { useFocused, useMessageComposerApi } from '../context';
import { loadDraftMessage, saveDraftMessage } from '../helpers';
import { useSubscription } from '../hooks';
import sharedStyles from '../../../views/Styles';
import { useTheme } from '../../../theme';
import { userTyping } from '../../../actions/room';
import { getRoomTitle } from '../../../lib/methods/helpers';
import { MIN_HEIGHT, markdownStyle } from '../constants';
import database from '../../../lib/database';
import { emitter } from '../emitter';
import { useRoomContext } from '../../../views/RoomView/context';
import { getMessageById } from '../../../lib/database/services/Message';

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

export const ComposerInput = memo(
	forwardRef<IComposerInput, IComposerInputProps>(({ inputRef }, ref) => {
		console.count('[MessageComposer] ComposerInput');
		const { colors, theme } = useTheme();
		const { rid, tmid, sharing, action, selectedMessages } = useRoomContext();
		const focused = useFocused();
		const { setFocused, setTrackingViewHeight, setMicOrSend } = useMessageComposerApi();
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
			if (action !== 'edit') {
				setDraftMessage();
			}

			return () => {
				if (action !== 'edit') {
					saveDraftMessage({ rid, tmid, draftMessage: textRef.current });
				}
			};
		}, [action, rid, tmid]);

		useEffect(() => {
			const fetchMessageAndSetInput = async () => {
				const message = await getMessageById(selectedMessages[0]);
				if (message) {
					setInput(message?.msg || '');
				}
			};

			if (action === 'edit' && selectedMessages[0]) {
				focus();
				fetchMessageAndSetInput();
			}
		}, [action, selectedMessages]);

		useEffect(() => {
			emitter.on('addMarkdown', ({ style }) => {
				const { start, end } = selectionRef.current;
				const text = textRef.current;
				const markdown = markdownStyle[style];
				const newText = `${text.substr(0, start)}${markdown}${text.substr(start, end - start)}${markdown}${text.substr(end)}`;
				setInput(newText, {
					start: start + markdown.length,
					end: start === end ? start + markdown.length : end + markdown.length
				});
			});
			return () => emitter.off('addMarkdown');
		}, [rid]);

		useImperativeHandle(ref, () => ({
			getTextAndClear: () => {
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
			if (inputRef.current) {
				inputRef.current.setNativeProps({ text });
			}
			if (selection) {
				selectionRef.current = selection;
				inputRef.current.setSelection?.(selection.start, selection.end);
			}
			setMicOrSend(text.length === 0 ? 'mic' : 'send');
		};

		const focus = () => {
			if (inputRef.current) {
				inputRef.current.focus();
			}
		};

		const onChangeText: TextInputProps['onChangeText'] = text => {
			// const isTextEmpty = text.length === 0;
			// setMicOrSend(!isTextEmpty ? 'send' : 'mic');
			debouncedOnChangeText(text);
			setInput(text);
		};

		const onSelectionChange: TextInputProps['onSelectionChange'] = e => {
			selectionRef.current = e.nativeEvent.selection;
		};

		const onFocus: TextInputProps['onFocus'] = () => {
			setFocused(true);
		};

		const onBlur: TextInputProps['onBlur'] = () => {
			setFocused(false);
		};

		const handleLayout: TextInputProps['onLayout'] = e => {
			setTrackingViewHeight(e.nativeEvent.layout.height);
		};

		// TODO: duplicated
		const stopAutocomplete = () => {
			emitter.emit('setAutocomplete', { text: '', type: null, params: '' });
		};

		const debouncedOnChangeText = useDebouncedCallback(async (text: string) => {
			const isTextEmpty = text.length === 0;
			handleTyping(!isTextEmpty);
			if (isTextEmpty || !focused) {
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
				stopAutocomplete();
				return;
			}
			if (text.match(/^\//)) {
				const commandParameter = text.match(/^\/([a-z0-9._-]+) (.+)/im);
				if (commandParameter) {
					const db = database.active;
					const [, command, params] = commandParameter;
					const commandsCollection = db.get('slash_commands');
					try {
						const commandRecord = await commandsCollection.find(command);
						if (commandRecord.providesPreview) {
							emitter.emit('setAutocomplete', { params, text: command, type: '/preview' });
							return;
						}
					} catch (e) {
						// do nothing
					}
				}
				emitter.emit('setAutocomplete', { text: autocompleteText, type: '/' });
				return;
			}
			if (lastWord.match(/^#/)) {
				emitter.emit('setAutocomplete', { text: autocompleteText, type: '#' });
				return;
			}
			if (lastWord.match(/^@/)) {
				emitter.emit('setAutocomplete', { text: autocompleteText, type: '@' });
				return;
			}
			if (lastWord.match(/^:/)) {
				emitter.emit('setAutocomplete', { text: autocompleteText, type: ':' });
				return;
			}
			if (lastWord.match(/^!/) && subscription?.t === 'l') {
				emitter.emit('setAutocomplete', { text: autocompleteText, type: '!' });
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
	})
);
