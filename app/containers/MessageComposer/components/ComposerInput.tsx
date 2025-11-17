import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle } from 'react';
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
import { useAutocompleteParams, useFocused, useMessageComposerApi, useMicOrSend } from '../context';
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

const defaultSelection: IInputSelection = { start: 0, end: 0 };

function calculateLength(startingText: string, markdown: string, isCodeBlock: boolean){
    if(isCodeBlock){
        if(startingText.length > 0){
            return markdown.length + 2;
        }
        
        return markdown.length + 1;
    }

    const endWithSpace = startingText.endsWith(' ');

    return markdown.length + (startingText.length > 0 ? 1 : 0) + (endWithSpace ? -1 : 0);
}

function getSeparator(startingText: string, isCodeBlock: boolean){
    if(startingText.length === 0){
        return '';
    }

    if(isCodeBlock){
        return '\n';
    }

    return startingText.endsWith(' ') ? '' : ' ';
}

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
		const dispatch = useDispatch();
		const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
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
                        const isCodeBlock = style === 'code-block';
                        const startingText = text.substr(0, start);
                        console.log(style);

                        const separator = getSeparator(startingText, isCodeBlock);
                        const closingNewlines = (isCodeBlock) ? '\n\n' : '';
                        const beforeMarkdownClose = (isCodeBlock && start !== end) ? '\n' : '';
                        
                        const newText = `${startingText}${separator}${markdown}${closingNewlines}${text.substr(start, end - start)}${beforeMarkdownClose}${markdown}${text.substr(end)}`;
                        const length = calculateLength(startingText, markdown, isCodeBlock, start, end);
                        
						setInput(newText, {
							start: start + length,
							end: start === end ? start + length : end + length
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
				setInput('', { start: 0, end: 0 }, true);
				return text;
			},
			getText: () => textRef.current,
			getSelection: () => selectionRef.current,
			setInput,
			onAutocompleteItemSelected,
			focus
		}));

		const setInput: TSetInput = (text, selection, forceUpdateDraftMessage) => {
			const message = text;
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
			const newText = `${result}${mention} ${text.slice(cursor)}`.trim()

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
