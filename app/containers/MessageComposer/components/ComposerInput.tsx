import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle } from 'react';
import { TextInput, StyleSheet, TextInputProps, InteractionManager } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import { useDispatch } from 'react-redux';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';

import I18n from '../../../i18n';
import { IAutocompleteItemProps, IComposerInput, IComposerInputProps, IInputSelection, TSetInput } from '../interfaces';
import { useAutocompleteParams, useFocused, useMessageComposerApi, useMicOrSend } from '../context';
import { fetchIsAllOrHere, getMentionRegexp } from '../helpers';
import { useSubscription, useAutoSaveDraft } from '../hooks';
import sharedStyles from '../../../views/Styles';
import { useTheme } from '../../../theme';
import { userTyping } from '../../../actions/room';
import { getRoomTitle, isTablet, parseJson } from '../../../lib/methods/helpers';
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
import { generateTriggerId } from '../../../lib/methods';
import { Services } from '../../../lib/services';
import log from '../../../lib/methods/helpers/log';
import { useAppSelector, usePrevious } from '../../../lib/hooks';
import { ChatsStackParamList } from '../../../stacks/types';
import { loadDraftMessage } from '../../../lib/methods/draftMessage';

const defaultSelection: IInputSelection = { start: 0, end: 0 };

export const ComposerInput = memo(
	forwardRef<IComposerInput, IComposerInputProps>(({ inputRef }, ref) => {
		const { colors, theme } = useTheme();
		const { rid, tmid, sharing, action, selectedMessages, setQuotesAndText } = useRoomContext();
		const focused = useFocused();
		const { setFocused, setMicOrSend, setAutocompleteParams } = useMessageComposerApi();
		const autocompleteType = useAutocompleteParams()?.type;
		const textRef = React.useRef('');
		const firstRender = React.useRef(false);
		const selectionRef = React.useRef<IInputSelection>(defaultSelection);
		const dispatch = useDispatch();
		const subscription = useSubscription(rid);
		const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
		let placeholder = tmid ? I18n.t('Add_thread_reply') : '';
		if (subscription && !tmid) {
			placeholder = I18n.t('Message_roomname', { roomName: (subscription.t === 'd' ? '@' : '#') + getRoomTitle(subscription) });
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

			if (sharing) return;
			if (usedCannedResponse) setInput(usedCannedResponse);
			if (action !== 'edit' && !firstRender.current) {
				firstRender.current = true;
				setDraftMessage();
			}
		}, [action, rid, tmid, usedCannedResponse, firstRender.current]);

		// Edit/quote
		useEffect(() => {
			const fetchMessageAndSetInput = async () => {
				const message = await getMessageById(selectedMessages[0]);
				if (message) {
					setInput(message?.msg || '');
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
			onAutocompleteItemSelected
		}));

		const setInput: TSetInput = (text, selection, forceUpdateDraftMessage) => {
			const message = text.trim();
			textRef.current = message;

			if (forceUpdateDraftMessage) {
				saveMessageDraft('');
			}

			inputRef.current?.setNativeProps?.({ text });

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

		const onChangeText: TextInputProps['onChangeText'] = text => {
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

		const onBlur: TextInputProps['onBlur'] = () => {
			setFocused(false);
			stopAutocomplete();
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
					Services.executeCommandPreview(item.text, item.params, rid, item.preview, triggerId, tmid);
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
			if (lastWord.match(/^!/) && subscription?.t === 'l') {
				setAutocompleteParams({ text: autocompleteText, type: '!' });
				return;
			}

			stopAutocomplete();
		}, 300);

		const handleTyping = (isTyping: boolean) => {
			if (sharing || !rid) return;
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
				onFocus={onFocus}
				onBlur={onBlur}
				underlineColorAndroid='transparent'
				defaultValue=''
				multiline
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
