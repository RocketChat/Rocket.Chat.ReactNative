import React, { forwardRef, memo, useCallback, useContext, useEffect, useImperativeHandle } from 'react';
import { TextInput, StyleSheet, type TextInputProps, InteractionManager } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import { useDispatch } from 'react-redux';
import { type RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';

import { textInputDebounceTime } from '../../../lib/constants/debounceConfig';
import I18n from '../../../i18n';
import {
	type IAutocompleteItemProps,
	type IComposerInput,
	type IComposerInputProps,
	type IInputSelection,
	type TSetInput
} from '../interfaces';
import { useAutocompleteParams, useFocused, useMessageComposerApi, useMicOrSend, MessageInnerContext } from '../context';
import { fetchIsAllOrHere, getMentionRegexp } from '../helpers';
import { useAutoSaveDraft } from '../hooks';
import sharedStyles from '../../../views/Styles';
import { useTheme } from '../../../theme';
import { userTyping } from '../../../actions/room';
import { parseJson } from '../../../lib/methods/helpers/parseJson';
import { getRoomTitle } from '../../../lib/methods/helpers/helpers';
import { isTablet } from '../../../lib/methods/helpers/deviceInfo';
import {
	MAX_HEIGHT,
	MIN_HEIGHT,
	NO_CANNED_RESPONSES,
	MARKDOWN_STYLES,
	COMPOSER_INPUT_PLACEHOLDER_MAX_LENGTH
} from '../constants';
import database from '../../../lib/database';
import Navigation from '../../../lib/navigation/appNavigation';
import { emitter } from '../../../lib/methods/helpers/emitter';
import { useRoomContext } from '../../../views/RoomView/context';
import { getMessageById } from '../../../lib/database/services/Message';
import { generateTriggerId } from '../../../lib/methods/actions';
import { executeCommandPreview } from '../../../lib/services/restApi';
import log from '../../../lib/methods/helpers/log';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { usePrevious } from '../../../lib/hooks/usePrevious';
import { type ChatsStackParamList } from '../../../stacks/types';
import { loadDraftMessage } from '../../../lib/methods/draftMessage';
import useIOSBackSwipeHandler from '../hooks/useIOSBackSwipeHandler';
import { useUserPreferences } from '../../../lib/methods/userPreferences';
import { ENTER_KEY_BEHAVIOR_PREFERENCES_KEY } from '../../../lib/constants/keys';

const defaultSelection: IInputSelection = { start: 0, end: 0 };

export const ComposerInput = memo(
	forwardRef<IComposerInput, IComposerInputProps>(({ inputRef }, ref) => {
		const { colors, theme } = useTheme();
		const { rid, tmid, sharing, action, selectedMessages, setQuotesAndText, room } = useRoomContext();
		const focused = useFocused();
		const { setFocused, setMicOrSend, setAutocompleteParams } = useMessageComposerApi();
		const autocompleteType = useAutocompleteParams()?.type;
		const textRef = React.useRef('');
		const firstRender = React.useRef(true);
		const selectionRef = React.useRef<IInputSelection>(defaultSelection);
		const shouldInterceptEnterRef = React.useRef(false);
		const previousTextRef = React.useRef('');
		const isUpdatingNativePropsRef = React.useRef(false);
		const dispatch = useDispatch();
		const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
		const [enterKeyBehavior] = useUserPreferences<'SEND' | 'NEW_LINE'>(ENTER_KEY_BEHAVIOR_PREFERENCES_KEY, 'NEW_LINE');
		const { sendMessage } = useContext(MessageInnerContext);
		let placeholder = tmid ? I18n.t('Add_thread_reply') : '';
		if (room && !tmid) {
			placeholder = I18n.t('Message_roomname', { roomName: (room.t === 'd' ? '@' : '#') + getRoomTitle(room) });
			if (!isTablet && placeholder.length > COMPOSER_INPUT_PLACEHOLDER_MAX_LENGTH) {
				placeholder = `${placeholder.slice(0, COMPOSER_INPUT_PLACEHOLDER_MAX_LENGTH)}...`;
			}
		}
		const route = useRoute<RouteProp<ChatsStackParamList, 'RoomView'>>();
		const usedCannedResponse = route.params?.usedCannedResponse;
		const prevAction = usePrevious(action);

		// subscribe to changes on mic state to update draft after a message is sent
		useMicOrSend();
		const { saveMessageDraft } = useAutoSaveDraft(textRef.current);

		// workaround to handle issues with iOS back swipe navigation
		const { iOSBackSwipe } = useIOSBackSwipeHandler();

		// Draft/Canned Responses
		useEffect(() => {
			const setDraftMessage = async () => {
				const draftMessage = await loadDraftMessage({ rid, tmid });
				if (draftMessage) {
					const parsedDraft = parseJson(draftMessage);
					if (parsedDraft?.msg || parsedDraft?.quotes) {
						setQuotesAndText?.(parsedDraft.msg, parsedDraft.quotes);
					} else {
						setInput(draftMessage);
					}
				}
			};

			if (action !== 'edit' && firstRender.current) {
				firstRender.current = false;
				setDraftMessage();
			}
			if (sharing) return;
			if (usedCannedResponse) setInput(usedCannedResponse);
		}, [action, rid, tmid, usedCannedResponse]);

		// Edit/quote
		useEffect(() => {
			const fetchMessageAndSetInput = async () => {
				const message = await getMessageById(selectedMessages[0]);
				if (message) {
					setInput(message?.msg || message?.attachments?.[0]?.description || '');
				}
			};

			if (sharing) return;

			if (prevAction === 'edit' && action !== 'edit') {
				setInput('');
				return;
			}
			if (action === 'edit' && selectedMessages[0]) {
				focus();
				fetchMessageAndSetInput();
				return;
			}
			if (action === 'quote' && selectedMessages.length) {
				focus();
			}
		}, [action, selectedMessages]);

		useFocusEffect(
			useCallback(() => {
				const task = InteractionManager.runAfterInteractions(() => {
					emitter.on('addMarkdown', ({ style }) => {
						const { start, end } = selectionRef.current;
						const text = textRef.current;
						const markdown = MARKDOWN_STYLES[style];
						const newText = `${text.substr(0, start)}${markdown}${text.substr(start, end - start)}${markdown}${text.substr(end)}`;
						setInput(newText, {
							start: start + markdown.length,
							end: start === end ? start + markdown.length : end + markdown.length
						});
					});
					emitter.on('toolbarMention', () => {
						if (autocompleteType) {
							return;
						}
						const { start, end } = selectionRef.current;
						const text = textRef.current;
						const newText = `${text.substr(0, start)}@${text.substr(start, end - start)}${text.substr(end)}`;
						setInput(newText, { start: start + 1, end: start === end ? start + 1 : end + 1 });
						setAutocompleteParams({ text: '', type: '@' });
					});
				});
				return () => {
					emitter.off('addMarkdown');
					emitter.off('toolbarMention');
					task?.cancel();
				};
			}, [rid, tmid, autocompleteType])
		);

		useImperativeHandle(ref, () => ({
			getTextAndClear: () => {
				const text = textRef.current;
				setInput('', undefined, true);
				return text;
			},
			getText: () => textRef.current,
			getSelection: () => selectionRef.current,
			setInput,
			onAutocompleteItemSelected,
			focus
		}));

		const setInput: TSetInput = (text, selection, forceUpdateDraftMessage) => {
			const message = text.trim();
			textRef.current = message;
			previousTextRef.current = text; // Update previous text ref for iOS newline detection

			if (forceUpdateDraftMessage) {
				saveMessageDraft('');
			}

			// Set flag to prevent onChangeText from firing when we update native props
			isUpdatingNativePropsRef.current = true;
			inputRef.current?.setNativeProps?.({ text });
			// Reset flag after a microtask to allow native update to complete
			// This prevents onChangeText from being triggered by setNativeProps
			setTimeout(() => {
				isUpdatingNativePropsRef.current = false;
			}, 0);

			if (selection) {
				// setSelection won't trigger onSelectionChange, so we need it to be ran after new text is set
				setTimeout(() => {
					inputRef.current?.setSelection?.(selection.start, selection.end);
					selectionRef.current = selection;
				}, 50);
			}
			setMicOrSend(message.length === 0 ? 'mic' : 'send');
		};

		const focus = () => {
			setTimeout(() => {
				if (inputRef.current) {
					inputRef.current.focus();
				}
			}, 300);
		};

		const sendViaEnterKey = (textWithoutNewline: string) => {
			// Mirror the send-button pipeline: first sync the TextInput value/refs,
			// then trigger the shared send handler so it can clear the field via getTextAndClear.
			setInput(textWithoutNewline);
			requestAnimationFrame(() => {
				sendMessage();
			});
		};

	const onChangeText: TextInputProps['onChangeText'] = text => {
		// Skip if we're updating native props to prevent recursive calls
		if (isUpdatingNativePropsRef.current) {
			isUpdatingNativePropsRef.current = false;
			return;
		}

		// Handle Enter key behavior for tablets - similar to Rocket.Chat desktop
		// When sendOnEnter is enabled, Enter sends message instead of creating newline
		if (isTablet && enterKeyBehavior === 'SEND' && !sharing && rid) {
			const previousText = previousTextRef.current;
			const hasNewline = text.endsWith('\n');

			// Detect if Enter was pressed by checking:
			// 1. Text ends with newline
			// 2. The text before newline matches previous text (Enter was just pressed, not pasted text)
			// 3. OR the flag was set by onKeyPress (Android detection)
			const isNewlineAdded = hasNewline && text.slice(0, -1) === previousText;
			const shouldIntercept = shouldInterceptEnterRef.current || isNewlineAdded;

			if (shouldIntercept && hasNewline) {
				const textWithoutNewline = text.slice(0, -1);
				const trimmedText = textWithoutNewline.trim();

				// Reset the flag immediately
				shouldInterceptEnterRef.current = false;

				if (trimmedText) {
					sendViaEnterKey(textWithoutNewline);
					return;
				}

				// Empty or whitespace-only: rollback to the previous value (no newline)
				setInput(previousText);
				return;
			}
		}
		
		// Normal flow: update text
		previousTextRef.current = text;
		textRef.current = text;
		debouncedOnChangeText(text);
		setInput(text);
	};

		const onSelectionChange: TextInputProps['onSelectionChange'] = e => {
			selectionRef.current = e.nativeEvent.selection;
		};

		const onFocus: TextInputProps['onFocus'] = () => {
			setFocused(true);
		};

		const onTouchStart: TextInputProps['onTouchStart'] = () => {
			setFocused(true);
		};

		const onBlur: TextInputProps['onBlur'] = () => {
			if (!iOSBackSwipe.current) {
				setFocused(false);
				stopAutocomplete();
			}
		};

		const onAutocompleteItemSelected: IAutocompleteItemProps['onPress'] = async item => {
			if (item.type === 'loading') {
				return null;
			}

			// If it's slash command preview, we need to execute the command
			if (item.type === '/preview') {
				try {
					if (!rid) return;
					const db = database.active;
					const commandsCollection = db.get('slash_commands');
					const commandRecord = await commandsCollection.find(item.text);
					const { appId } = commandRecord;
					const triggerId = generateTriggerId(appId);
					executeCommandPreview(item.text, item.params, rid, item.preview, triggerId, tmid);
				} catch (e) {
					log(e);
				}
				requestAnimationFrame(() => {
					stopAutocomplete();
					setInput('', { start: 0, end: 0 });
				});
				return;
			}

			// If it's canned response, but there's no canned responses, we open the canned responses view
			if (item.type === '!' && item.id === NO_CANNED_RESPONSES) {
				const params = { rid };
				if (isMasterDetail) {
					Navigation.navigate('ModalStackNavigator', { screen: 'CannedResponsesListView', params });
				} else {
					Navigation.navigate('CannedResponsesListView', params);
				}
				stopAutocomplete();
				return;
			}

			const text = textRef.current;
			const { start, end } = selectionRef.current;
			const cursor = Math.max(start, end);
			const regexp = getMentionRegexp();
			let result = text.substr(0, cursor).replace(regexp, '');
			// Remove the ! after select the canned response
			if (item.type === '!') {
				const lastIndexOfExclamation = text.lastIndexOf('!', cursor);
				result = text.substr(0, lastIndexOfExclamation).replace(regexp, '');
			}
			let mention = '';
			switch (item.type) {
				case '@':
					mention = fetchIsAllOrHere(item) ? item.title : item.subtitle || item.title;
					break;
				case '#':
					mention = item.subtitle ? item.subtitle : '';
					break;
				case ':':
					mention = `${typeof item.emoji === 'string' ? item.emoji : item.emoji.name}:`;
					break;
				case '/':
					mention = item.title;
					break;
				case '!':
					mention = item.subtitle ? item.subtitle : '';
					break;
				default:
					mention = '';
			}
			const newText = `${result}${mention} ${text.slice(cursor)}`;

			const newCursor = result.length + mention.length + 1;
			setInput(newText, { start: newCursor, end: newCursor });
			focus();
			requestAnimationFrame(() => {
				stopAutocomplete();
			});
		};

		const stopAutocomplete = () => {
			setAutocompleteParams({ text: '', type: null, params: '' });
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
			if (!sharing && text.match(/^\//)) {
				const commandParameter = text.match(/^\/([a-z0-9._-]+) (.+)/im);
				if (commandParameter) {
					const db = database.active;
					const [, command, params] = commandParameter;
					const commandsCollection = db.get('slash_commands');
					try {
						const commandRecord = await commandsCollection.find(command);
						if (commandRecord.providesPreview) {
							setAutocompleteParams({ params, text: command, type: '/preview' });
						}
						return;
					} catch (e) {
						// do nothing
					}
				}
				setAutocompleteParams({ text: autocompleteText, type: '/' });
				return;
			}
			if (lastWord.match(/^#/)) {
				setAutocompleteParams({ text: autocompleteText, type: '#' });
				return;
			}
			if (lastWord.match(/^@/)) {
				setAutocompleteParams({ text: autocompleteText, type: '@' });
				return;
			}
			if (lastWord.match(/^:/)) {
				setAutocompleteParams({ text: autocompleteText, type: ':' });
				return;
			}
			if (lastWord.match(/^!/) && room?.t === 'l') {
				setAutocompleteParams({ text: autocompleteText, type: '!' });
				return;
			}

			stopAutocomplete();
		}, textInputDebounceTime);

	const handleTyping = (isTyping: boolean) => {
		if (sharing || !rid) return;
		dispatch(userTyping(rid, isTyping));
	};

	const onKeyPress: TextInputProps['onKeyPress'] = e => {
		// Only handle Enter key behavior on tablets
		if (!isTablet) {
			return;
		}

		// Check if Enter key was pressed (works reliably on Android, may not fire on iOS for multiline)
		// This provides early detection on Android, but onChangeText comparison is the fallback for iOS
		const isEnterKey = e.nativeEvent.key === 'Enter' || e.nativeEvent.key === '\n';

		if (isEnterKey && enterKeyBehavior === 'SEND' && !sharing && rid) {
			// Set flag to intercept the newline in onChangeText
			// This works on Android where onKeyPress fires reliably
			shouldInterceptEnterRef.current = true;
		} else {
			// Reset flag for other keys
			shouldInterceptEnterRef.current = false;
		}
		// If setting is NEW_LINE, default behavior (multiline) will handle it
	};

	return (
		<TextInput
			style={[styles.textInput, { color: colors.fontDefault }]}
			placeholder={placeholder}
			placeholderTextColor={colors.fontAnnotation}
			ref={component => {
				inputRef.current = component;
			}}
			blurOnSubmit={false}
			onChangeText={onChangeText}
			onTouchStart={onTouchStart}
			onSelectionChange={onSelectionChange}
			onFocus={onFocus}
			onBlur={onBlur}
			onKeyPress={onKeyPress}
			underlineColorAndroid='transparent'
			defaultValue=''
			multiline
			{...(autocompleteType ? { autoComplete: 'off', autoCorrect: false, autoCapitalize: 'none' } : {})}
			keyboardAppearance={theme === 'light' ? 'light' : 'dark'}
			// eslint-disable-next-line no-nested-ternary
			testID={`message-composer-input${tmid ? '-thread' : sharing ? '-share' : ''}`}
		/>
	);
	})
);

const styles = StyleSheet.create({
	textInput: {
		flex: 1,
		minHeight: MIN_HEIGHT,
		maxHeight: MAX_HEIGHT,
		paddingTop: 12,
		paddingBottom: 12,
		fontSize: 16,
		textAlignVertical: 'center',
		...sharedStyles.textRegular,
		lineHeight: 22
	}
});
