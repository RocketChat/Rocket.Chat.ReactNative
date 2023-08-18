import React, { Component } from 'react';
import { Alert, Keyboard, NativeModules, Text, View, BackHandler } from 'react-native';
import { connect } from 'react-redux';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';
import ImagePicker, { Image, ImageOrVideo, Options } from 'react-native-image-crop-picker';
import { dequal } from 'dequal';
import DocumentPicker from 'react-native-document-picker';
import { Q } from '@nozbe/watermelondb';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

import { generateTriggerId } from '../../lib/methods/actions';
import { TextInput, IThemedTextInput } from '../TextInput';
import { userTyping as userTypingAction } from '../../actions/room';
import styles from './styles';
import database from '../../lib/database';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import RecordAudio from './RecordAudio';
import I18n from '../../i18n';
import ReplyPreview from './ReplyPreview';
import { themes, emojis } from '../../lib/constants';
import LeftButtons from './LeftButtons';
import RightButtons from './RightButtons';
import { canUploadFile } from '../../lib/methods/helpers/media';
import EventEmiter from '../../lib/methods/helpers/events';
import { KEY_COMMAND, handleCommandShowUpload, handleCommandSubmit, handleCommandTyping } from '../../commands';
import getMentionRegexp from './getMentionRegexp';
import Mentions from './Mentions';
import MessageboxContext from './Context';
import {
	MENTIONS_COUNT_TO_DISPLAY,
	MENTIONS_TRACKING_TYPE_CANNED,
	MENTIONS_TRACKING_TYPE_COMMANDS,
	MENTIONS_TRACKING_TYPE_EMOJIS,
	MENTIONS_TRACKING_TYPE_ROOMS,
	MENTIONS_TRACKING_TYPE_USERS,
	TIMEOUT_CLOSE_EMOJI
} from './constants';
import CommandsPreview from './CommandsPreview';
import { getUserSelector } from '../../selectors/login';
import Navigation from '../../lib/navigation/appNavigation';
import { TActionSheetOptionsItem, withActionSheet } from '../ActionSheet';
import { sanitizeLikeString } from '../../lib/database/utils';
import { CustomIcon } from '../CustomIcon';
import { forceJpgExtension } from './forceJpgExtension';
import {
	IApplicationState,
	IBaseScreen,
	IPreviewItem,
	IUser,
	TGetCustomEmoji,
	TSubscriptionModel,
	TThreadModel,
	IMessage,
	IEmoji
} from '../../definitions';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { getPermalinkMessage, search, sendFileMessage } from '../../lib/methods';
import { hasPermission, debounce, isAndroid, isIOS, isTablet, compareServerVersion } from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import { TSupportedThemes } from '../../theme';
import { ChatsStackParamList } from '../../stacks/types';
import { EventTypes } from '../EmojiPicker/interfaces';
import EmojiSearchbar from './EmojiSearchbar';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';

require('./EmojiKeyboard');

const imagePickerConfig = {
	cropping: true,
	avoidEmptySpaceAroundImage: false,
	freeStyleCropEnabled: true,
	forceJpg: true
};

const libraryPickerConfig: Options = {
	multiple: true,
	compressVideoPreset: 'Passthrough',
	mediaType: 'any',
	forceJpg: true
};

const videoPickerConfig: Options = {
	mediaType: 'video'
};

export interface IMessageBoxProps extends IBaseScreen<ChatsStackParamList & MasterDetailInsideStackParamList, any> {
	rid: string;
	baseUrl: string;
	message: IMessage;
	replying: boolean;
	editing: boolean;
	threadsEnabled: boolean;
	isFocused(): boolean;
	user: IUser;
	roomType: string;
	tmid: string;
	replyWithMention: boolean;
	FileUpload_MediaTypeWhiteList: string;
	FileUpload_MaxFileSize: number;
	Message_AudioRecorderEnabled: boolean;
	getCustomEmoji: TGetCustomEmoji;
	editCancel: Function;
	editRequest: Function;
	onSubmit: Function;
	typing: Function;
	theme: TSupportedThemes;
	replyCancel(): void;
	showSend: boolean;
	children: JSX.Element;
	isMasterDetail: boolean;
	showActionSheet: Function;
	iOSScrollBehavior: number;
	sharing: boolean;
	isActionsEnabled: boolean;
	usedCannedResponse: string;
	uploadFilePermission: string[];
	goToCannedResponses: () => void | null;
	serverVersion: string;
}

interface IMessageBoxState {
	mentions: any[];
	showEmojiKeyboard: boolean;
	showSend: any;
	recording: boolean;
	trackingType: string;
	commandPreview: IPreviewItem[];
	showCommandPreview: boolean;
	command: {
		appId?: string;
	};
	tshow: boolean;
	mentionLoading: boolean;
	permissionToUpload: boolean;
	showEmojiSearchbar: boolean;
}

class MessageBox extends Component<IMessageBoxProps, IMessageBoxState> {
	public text: string;

	private selection: { start: number; end: number };

	private focused: boolean;

	private imagePickerConfig: Options;

	private libraryPickerConfig: Options;

	private videoPickerConfig: Options;

	private room!: TSubscriptionModel;

	private thread!: TThreadModel;

	private unsubscribeFocus: any;

	private trackingTimeout: any;

	private tracking: any;

	private unsubscribeBlur: any;

	private component: any;

	private typingTimeout: any;

	static defaultProps = {
		message: {
			id: ''
		},
		sharing: false,
		iOSScrollBehavior: NativeModules.KeyboardTrackingViewTempManager?.KeyboardTrackingScrollBehaviorFixedOffset,
		isActionsEnabled: true,
		getCustomEmoji: () => {}
	};

	constructor(props: IMessageBoxProps) {
		super(props);
		this.state = {
			mentions: [],
			showEmojiKeyboard: false,
			showSend: props.showSend,
			recording: false,
			trackingType: '',
			commandPreview: [],
			showCommandPreview: false,
			command: {},
			tshow: this.sendThreadToChannel,
			mentionLoading: false,
			permissionToUpload: true,
			showEmojiSearchbar: false
		};
		this.text = '';
		this.selection = { start: 0, end: 0 };
		this.focused = false;

		const libPickerLabels = {
			cropperChooseText: I18n.t('Choose'),
			cropperCancelText: I18n.t('Cancel'),
			loadingLabelText: I18n.t('Processing')
		};

		this.imagePickerConfig = {
			...imagePickerConfig,
			...libPickerLabels
		};

		this.libraryPickerConfig = {
			...libraryPickerConfig,
			...libPickerLabels
		};

		this.videoPickerConfig = {
			...videoPickerConfig,
			...libPickerLabels
		};

		BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
	}

	get sendThreadToChannel() {
		const { user, serverVersion, tmid } = this.props;
		if (tmid && compareServerVersion(serverVersion, 'lowerThan', '5.0.0')) {
			return false;
		}
		if (tmid && user.alsoSendThreadToChannel === 'default') {
			return false;
		}
		if (user.alsoSendThreadToChannel === 'always') {
			return true;
		}
		if (user.alsoSendThreadToChannel === 'never') {
			return false;
		}
		return true;
	}

	async componentDidMount() {
		const db = database.active;
		const { rid, tmid, navigation, sharing, usedCannedResponse } = this.props;
		let msg;
		try {
			const threadsCollection = db.get('threads');
			const subsCollection = db.get('subscriptions');
			try {
				this.room = await subsCollection.find(rid);
			} catch (error) {
				console.log('Messagebox.didMount: Room not found');
			}
			if (tmid) {
				try {
					this.thread = await threadsCollection.find(tmid);
					if (this.thread && !sharing) {
						msg = this.thread.draftMessage;
					}
				} catch (error) {
					console.log('Messagebox.didMount: Thread not found');
				}
			} else if (!sharing) {
				msg = this.room?.draftMessage;
			}
		} catch (e) {
			log(e);
		}

		if (msg) {
			this.setInput(msg);
			this.setShowSend(true);
		}

		if (isTablet) {
			EventEmiter.addEventListener(KEY_COMMAND, this.handleCommands);
		}

		if (usedCannedResponse) {
			this.onChangeText(usedCannedResponse);
		}

		this.setOptions();

		this.unsubscribeFocus = navigation.addListener('focus', () => {
			// didFocus
			// We should wait pushed views be dismissed
			this.trackingTimeout = setTimeout(() => {
				if (this.tracking && this.tracking.resetTracking) {
					// Reset messageBox keyboard tracking
					this.tracking.resetTracking();
				}
			}, 500);
		});
		this.unsubscribeBlur = navigation.addListener('blur', () => {
			this.closeEmoji();
			this.component?.blur();
		});
	}

	UNSAFE_componentWillReceiveProps(nextProps: any) {
		const { isFocused, editing, replying, sharing, usedCannedResponse } = this.props;
		if (!isFocused?.()) {
			return;
		}
		if (usedCannedResponse !== nextProps.usedCannedResponse) {
			this.onChangeText(nextProps.usedCannedResponse ?? '');
		}
		if (sharing && !replying) {
			this.setInput(nextProps.message.msg ?? '');
			return;
		}
		if (editing !== nextProps.editing && nextProps.editing) {
			this.setInput(nextProps.message.msg);
			if (this.text) {
				this.setShowSend(true);
			}
			this.focus();
		} else if (replying !== nextProps.replying && nextProps.replying) {
			this.focus();
		} else if (!nextProps.message) {
			this.clearInput();
		}
		if (this.trackingTimeout) {
			clearTimeout(this.trackingTimeout);
			this.trackingTimeout = false;
		}
	}

	shouldComponentUpdate(nextProps: IMessageBoxProps, nextState: IMessageBoxState) {
		const {
			showEmojiKeyboard,
			showSend,
			recording,
			mentions,
			commandPreview,
			tshow,
			mentionLoading,
			trackingType,
			permissionToUpload,
			showEmojiSearchbar
		} = this.state;

		const {
			roomType,
			replying,
			editing,
			isFocused,
			message,
			theme,
			usedCannedResponse,
			uploadFilePermission,
			goToCannedResponses
		} = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.showEmojiKeyboard !== showEmojiKeyboard) {
			return true;
		}
		if (nextState.showEmojiSearchbar !== showEmojiSearchbar) {
			return true;
		}
		if (!isFocused()) {
			return false;
		}
		if (nextProps.roomType !== roomType) {
			return true;
		}
		if (nextProps.replying !== replying) {
			return true;
		}
		if (nextProps.editing !== editing) {
			return true;
		}
		if (nextState.trackingType !== trackingType) {
			return true;
		}
		if (nextState.mentionLoading !== mentionLoading) {
			return true;
		}
		if (nextState.showSend !== showSend) {
			return true;
		}
		if (nextState.recording !== recording) {
			return true;
		}
		if (nextState.tshow !== tshow) {
			return true;
		}
		if (nextState.permissionToUpload !== permissionToUpload) {
			return true;
		}
		if (!dequal(nextState.mentions, mentions)) {
			return true;
		}
		if (!dequal(nextState.commandPreview, commandPreview)) {
			return true;
		}
		if (!dequal(nextProps.message?.id, message?.id)) {
			return true;
		}
		if (!dequal(nextProps.uploadFilePermission, uploadFilePermission)) {
			return true;
		}
		if (nextProps.usedCannedResponse !== usedCannedResponse) {
			return true;
		}
		if (nextProps.goToCannedResponses !== goToCannedResponses) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps: IMessageBoxProps) {
		const { uploadFilePermission, goToCannedResponses, replyWithMention, threadsEnabled } = this.props;
		if (prevProps.replyWithMention !== replyWithMention) {
			if (threadsEnabled && replyWithMention) {
				this.setState({ tshow: this.sendThreadToChannel });
			}
		}
		if (!dequal(prevProps.uploadFilePermission, uploadFilePermission) || prevProps.goToCannedResponses !== goToCannedResponses) {
			this.setOptions();
		}
	}

	componentWillUnmount() {
		console.countReset(`${this.constructor.name}.render calls`);
		if (this.onChangeText && this.onChangeText.stop) {
			this.onChangeText.stop();
		}
		if (this.getUsers && this.getUsers.stop) {
			this.getUsers.stop();
		}
		if (this.getRooms && this.getRooms.stop) {
			this.getRooms.stop();
		}
		if (this.getEmojis && this.getEmojis.stop) {
			this.getEmojis.stop();
		}
		if (this.getSlashCommands && this.getSlashCommands.stop) {
			this.getSlashCommands.stop();
		}
		if (this.getCannedResponses && this.getCannedResponses.stop) {
			this.getCannedResponses.stop();
		}
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
		if (isTablet) {
			EventEmiter.removeListener(KEY_COMMAND, this.handleCommands);
		}
		BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
	}

	setOptions = async () => {
		const { uploadFilePermission, rid } = this.props;

		// Servers older than 4.2
		if (!uploadFilePermission) {
			this.setState({ permissionToUpload: true });
			return;
		}

		const permissionToUpload = await hasPermission([uploadFilePermission], rid);
		this.setState({ permissionToUpload: permissionToUpload[0] });
	};

	onChangeText: any = (text: string): void => {
		const isTextEmpty = text.length === 0;
		this.setShowSend(!isTextEmpty);
		this.debouncedOnChangeText(text);
		this.setInput(text);
	};

	onSelectionChange = (e: any) => {
		this.selection = e.nativeEvent.selection;
	};

	// eslint-disable-next-line react/sort-comp
	debouncedOnChangeText = debounce(async (text: any) => {
		const { sharing, roomType } = this.props;
		const isTextEmpty = text.length === 0;
		if (isTextEmpty) {
			this.stopTrackingMention();
			return;
		}
		this.handleTyping(!isTextEmpty);
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);
		const whiteSpaceOrBreakLineRegex = /[\s\n]+/;
		const txt =
			cursor < text.length ? text.substr(0, cursor).split(whiteSpaceOrBreakLineRegex) : text.split(whiteSpaceOrBreakLineRegex);
		const lastWord = txt[txt.length - 1];
		const result = lastWord.substring(1);

		const commandMention = text.match(/^\//); // match only if message begins with /
		const channelMention = lastWord.match(/^#/);
		const userMention = lastWord.match(/^@/);
		const emojiMention = lastWord.match(/^:/);
		const cannedMention = lastWord.match(/^!/);

		if (commandMention && !sharing) {
			const command = text.substr(1);
			const commandParameter = text.match(/^\/([a-z0-9._-]+) (.+)/im);
			if (commandParameter) {
				const db = database.active;
				const [, name, params] = commandParameter;
				const commandsCollection = db.get('slash_commands');
				try {
					const commandRecord = await commandsCollection.find(name);
					if (commandRecord.providesPreview) {
						return this.setCommandPreview(commandRecord, name, params);
					}
				} catch (e) {
					// do nothing
				}
			}
			return this.identifyMentionKeyword(command, MENTIONS_TRACKING_TYPE_COMMANDS);
		}
		if (channelMention) {
			return this.identifyMentionKeyword(result, MENTIONS_TRACKING_TYPE_ROOMS);
		}
		if (userMention) {
			return this.identifyMentionKeyword(result, MENTIONS_TRACKING_TYPE_USERS);
		}
		if (emojiMention) {
			return this.identifyMentionKeyword(result, MENTIONS_TRACKING_TYPE_EMOJIS);
		}
		if (cannedMention && roomType === 'l') {
			return this.identifyMentionKeyword(result, MENTIONS_TRACKING_TYPE_CANNED);
		}
		return this.stopTrackingMention();
	}, 100);

	onKeyboardResigned = () => {
		const { showEmojiSearchbar } = this.state;
		if (!showEmojiSearchbar) {
			this.closeEmoji();
		}
	};

	onPressMention = (item: any) => {
		if (!this.component) {
			return;
		}
		const { trackingType } = this.state;
		const msg = this.text;
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);
		const regexp = getMentionRegexp();
		let result = msg.substr(0, cursor).replace(regexp, '');
		// Remove the ! after select the canned response
		if (trackingType === MENTIONS_TRACKING_TYPE_CANNED) {
			const lastIndexOfExclamation = msg.lastIndexOf('!', cursor);
			result = msg.substr(0, lastIndexOfExclamation).replace(regexp, '');
		}
		const mentionName =
			trackingType === MENTIONS_TRACKING_TYPE_EMOJIS
				? `${item.name || item}:`
				: item.username || item.name || item.command || item.text;
		const text = `${result}${mentionName} ${msg.slice(cursor)}`;
		if (trackingType === MENTIONS_TRACKING_TYPE_COMMANDS && item.providesPreview) {
			this.setState({ showCommandPreview: true });
		}

		const newCursor = cursor + mentionName.length;
		this.setInput(text, { start: newCursor, end: newCursor });
		this.focus();
		requestAnimationFrame(() => this.stopTrackingMention());
	};

	onPressCommandPreview = (item: any) => {
		const { command } = this.state;
		const {
			rid,
			tmid,
			message: { id: messageTmid },
			replyCancel
		} = this.props;
		const { text } = this;
		const name = text.substr(0, text.indexOf(' ')).slice(1);
		const params = text.substr(text.indexOf(' ') + 1) || 'params';
		this.setState({ commandPreview: [], showCommandPreview: false, command: {} });
		this.stopTrackingMention();
		this.clearInput();
		this.handleTyping(false);
		try {
			const { appId } = command;
			const triggerId = generateTriggerId(appId);
			Services.executeCommandPreview(name, params, rid, item, triggerId, tmid || messageTmid);
			replyCancel();
		} catch (e) {
			log(e);
		}
	};

	onKeyboardItemSelected = (keyboardId: string, params: { eventType: EventTypes; emoji: IEmoji }) => {
		const { eventType, emoji } = params;
		const { text } = this;
		let newText = '';
		// if messagebox has an active cursor
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);
		let newCursor;

		switch (eventType) {
			case EventTypes.BACKSPACE_PRESSED:
				logEvent(events.MB_BACKSPACE);
				const emojiRegex = /\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]/;
				let charsToRemove = 1;
				const lastEmoji = text.substr(cursor > 0 ? cursor - 2 : text.length - 2, cursor > 0 ? cursor : text.length);
				// Check if last character is an emoji
				if (emojiRegex.test(lastEmoji)) charsToRemove = 2;
				newText =
					text.substr(0, (cursor > 0 ? cursor : text.length) - charsToRemove) + text.substr(cursor > 0 ? cursor : text.length);
				newCursor = cursor - charsToRemove;
				this.setInput(newText, { start: newCursor, end: newCursor });
				this.setShowSend(newText !== '');
				break;
			case EventTypes.EMOJI_PRESSED:
				logEvent(events.MB_EMOJI_SELECTED);
				let emojiText = '';
				if (typeof emoji === 'string') {
					const shortname = `:${emoji}:`;
					emojiText = shortnameToUnicode(shortname);
				} else {
					emojiText = `:${emoji.name}:`;
				}
				newText = `${text.substr(0, cursor)}${emojiText}${text.substr(cursor)}`;
				newCursor = cursor + emojiText.length;
				this.setInput(newText, { start: newCursor, end: newCursor });
				this.setShowSend(true);
				break;
			case EventTypes.SEARCH_PRESSED:
				logEvent(events.MB_EMOJI_SEARCH_PRESSED);
				this.setState({ showEmojiKeyboard: false, showEmojiSearchbar: true });
				break;
			default:
			// Do nothing
		}
	};

	getPermalink = async (message: any) => {
		try {
			return await getPermalinkMessage(message);
		} catch (error) {
			return null;
		}
	};

	getFixedMentions = (keyword: any) => {
		let result: any = [];
		if ('all'.indexOf(keyword) !== -1) {
			result = [{ rid: -1, username: 'all' }];
		}
		if ('here'.indexOf(keyword) !== -1) {
			result = [{ rid: -2, username: 'here' }, ...result];
		}
		return result;
	};

	getUsers = debounce(async (keyword: any) => {
		const { rid } = this.props;
		let res = await search({ text: keyword, filterRooms: false, filterUsers: true, rid });
		res = [...this.getFixedMentions(keyword), ...res];
		this.setState({ mentions: res, mentionLoading: false });
	}, 300);

	getRooms = debounce(async (keyword = '') => {
		const res = await search({ text: keyword, filterRooms: true, filterUsers: false });
		this.setState({ mentions: res, mentionLoading: false });
	}, 300);

	getCustomEmojis = async (keyword: any, count: number) => {
		const likeString = sanitizeLikeString(keyword);
		const whereClause = [];
		if (likeString) {
			whereClause.push(Q.where('name', Q.like(`${likeString}%`)));
		}
		const db = database.active;
		const customEmojisCollection = db.get('custom_emojis');
		const customEmojis = await (await customEmojisCollection.query(...whereClause).fetch()).slice(0, count);
		return customEmojis;
	};

	getEmojis = debounce(async (keyword: any) => {
		const customEmojis = await this.getCustomEmojis(keyword, MENTIONS_COUNT_TO_DISPLAY);
		const filteredEmojis = emojis.filter(emoji => emoji.indexOf(keyword) !== -1).slice(0, MENTIONS_COUNT_TO_DISPLAY);
		const mergedEmojis = [...customEmojis, ...filteredEmojis].slice(0, MENTIONS_COUNT_TO_DISPLAY);
		this.setState({ mentions: mergedEmojis || [], mentionLoading: false });
	}, 300);

	getSlashCommands = debounce(async (keyword: any) => {
		const db = database.active;
		const commandsCollection = db.get('slash_commands');
		const likeString = sanitizeLikeString(keyword);
		const commands = await commandsCollection.query(Q.where('id', Q.like(`${likeString}%`))).fetch();
		this.setState({ mentions: commands || [], mentionLoading: false });
	}, 300);

	getCannedResponses = debounce(async (text?: string) => {
		const res = await Services.getListCannedResponse({ text });
		this.setState({ mentions: res.success ? res.cannedResponses : [], mentionLoading: false });
	}, 500);

	focus = () => {
		if (this.component && this.component.focus) {
			this.component.focus();
		}
	};

	handleTyping = (isTyping: boolean) => {
		const { typing, rid, sharing } = this.props;
		if (sharing) {
			return;
		}
		if (!isTyping) {
			if (this.typingTimeout) {
				clearTimeout(this.typingTimeout);
				this.typingTimeout = false;
			}
			typing(rid, false);
			return;
		}

		if (this.typingTimeout) {
			return;
		}

		this.typingTimeout = setTimeout(() => {
			typing(rid, true);
			this.typingTimeout = false;
		}, 1000);
	};

	setCommandPreview = async (command: any, name: string, params: string) => {
		const { rid } = this.props;
		try {
			const response = await Services.getCommandPreview(name, rid, params);
			if (response.success) {
				return this.setState({ commandPreview: response.preview?.items || [], showCommandPreview: true, command });
			}
		} catch (e) {
			log(e);
		}
		this.setState({ commandPreview: [], showCommandPreview: true, command: {} });
	};

	setInput = (text: any, selection?: any) => {
		this.text = text;
		if (selection) {
			this.selection = selection;
		}
		this.component.setNativeProps({ text });
	};

	setShowSend = (showSend: any) => {
		const { showSend: prevShowSend } = this.state;
		const { showSend: propShowSend } = this.props;
		if (prevShowSend !== showSend && !propShowSend) {
			this.setState({ showSend });
		}
	};

	clearInput = () => {
		const { tshow } = this.state;
		const { user, serverVersion } = this.props;
		this.setInput('');
		this.setShowSend(false);
		if (compareServerVersion(serverVersion, 'lowerThan', '5.0.0') || (tshow && user.alsoSendThreadToChannel === 'default')) {
			this.setState({ tshow: false });
		}
	};

	canUploadFile = (file: any) => {
		const { permissionToUpload } = this.state;
		const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = this.props;
		const result = canUploadFile({
			file,
			allowList: FileUpload_MediaTypeWhiteList,
			maxFileSize: FileUpload_MaxFileSize,
			permissionToUploadFile: permissionToUpload
		});
		if (result.success) {
			return true;
		}
		Alert.alert(I18n.t('Error_uploading'), result.error && I18n.isTranslated(result.error) ? I18n.t(result.error) : result.error);
		return false;
	};

	takePhoto = async () => {
		logEvent(events.ROOM_BOX_ACTION_PHOTO);
		try {
			let image = (await ImagePicker.openCamera(this.imagePickerConfig)) as Image;
			image = forceJpgExtension(image);
			if (this.canUploadFile(image)) {
				this.openShareView([image]);
			}
		} catch (e) {
			logEvent(events.ROOM_BOX_ACTION_PHOTO_F);
		}
	};

	takeVideo = async () => {
		logEvent(events.ROOM_BOX_ACTION_VIDEO);
		try {
			const video = await ImagePicker.openCamera(this.videoPickerConfig);
			if (this.canUploadFile(video)) {
				this.openShareView([video]);
			}
		} catch (e) {
			logEvent(events.ROOM_BOX_ACTION_VIDEO_F);
		}
	};

	chooseFromLibrary = async () => {
		logEvent(events.ROOM_BOX_ACTION_LIBRARY);
		try {
			// The type can be video or photo, however the lib understands that it is just one of them.
			let attachments = (await ImagePicker.openPicker(this.libraryPickerConfig)) as unknown as ImageOrVideo[];
			attachments = attachments.map(att => forceJpgExtension(att));
			this.openShareView(attachments);
		} catch (e) {
			logEvent(events.ROOM_BOX_ACTION_LIBRARY_F);
		}
	};

	chooseFile = async () => {
		logEvent(events.ROOM_BOX_ACTION_FILE);
		try {
			const res = await DocumentPicker.pickSingle({
				type: [DocumentPicker.types.allFiles]
			});
			const file = {
				filename: res.name,
				size: res.size,
				mime: res.type,
				path: res.uri
			};
			if (this.canUploadFile(file)) {
				this.openShareView([file]);
			}
		} catch (e: any) {
			if (!DocumentPicker.isCancel(e)) {
				logEvent(events.ROOM_BOX_ACTION_FILE_F);
				log(e);
			}
		}
	};

	onPressNoMatchCanned = () => {
		const { isMasterDetail, rid } = this.props;
		const params = { rid };
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'CannedResponsesListView', params });
		} else {
			Navigation.navigate('CannedResponsesListView', params);
		}
	};

	openShareView = (attachments: any) => {
		const { message, replyCancel, replyWithMention, replying } = this.props;
		// Start a thread with an attachment
		let value: TThreadModel | IMessage = this.thread;
		if (replyWithMention) {
			value = message;
			replyCancel();
		}
		Navigation.navigate('ShareView', {
			room: this.room,
			thread: value,
			attachments,
			replying,
			replyingMessage: message,
			closeReply: replyCancel
		});
	};

	createDiscussion = () => {
		logEvent(events.ROOM_BOX_ACTION_DISCUSSION);
		const { isMasterDetail } = this.props;
		const params = { channel: this.room, showCloseModal: true };
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'CreateDiscussionView', params });
		} else {
			Navigation.navigate('NewMessageStackNavigator', { screen: 'CreateDiscussionView', params });
		}
	};

	showMessageBoxActions = () => {
		logEvent(events.ROOM_SHOW_BOX_ACTIONS);
		const { permissionToUpload } = this.state;
		const { showActionSheet, goToCannedResponses } = this.props;

		const options: TActionSheetOptionsItem[] = [];
		if (goToCannedResponses) {
			options.push({
				title: I18n.t('Canned_Responses'),
				icon: 'canned-response',
				onPress: () => goToCannedResponses()
			});
		}
		if (permissionToUpload) {
			options.push(
				{
					title: I18n.t('Take_a_photo'),
					icon: 'camera-photo',
					onPress: this.takePhoto
				},
				{
					title: I18n.t('Take_a_video'),
					icon: 'camera',
					onPress: this.takeVideo
				},
				{
					title: I18n.t('Choose_from_library'),
					icon: 'image',
					onPress: this.chooseFromLibrary
				},
				{
					title: I18n.t('Choose_file'),
					icon: 'attach',
					onPress: this.chooseFile
				}
			);
		}

		options.push({
			title: I18n.t('Create_Discussion'),
			icon: 'discussions',
			onPress: this.createDiscussion
		});

		this.closeEmojiAndAction(showActionSheet, { options });
	};

	editCancel = () => {
		const { editCancel } = this.props;
		editCancel();
		this.clearInput();
	};

	openEmoji = () => {
		logEvent(events.ROOM_OPEN_EMOJI);
		this.setState({ showEmojiKeyboard: true, showEmojiSearchbar: false });
		this.stopTrackingMention();
	};

	recordingCallback = (recording: any) => {
		this.setState({ recording });
	};

	finishAudioMessage = async (fileInfo: any) => {
		const { rid, tmid, baseUrl: server, user } = this.props;

		if (fileInfo) {
			try {
				if (this.canUploadFile(fileInfo)) {
					await sendFileMessage(rid, fileInfo, tmid, server, user);
				}
			} catch (e) {
				log(e);
			}
		}
	};

	closeEmoji = () => {
		this.setState({ showEmojiKeyboard: false, showEmojiSearchbar: false });
	};

	closeEmojiKeyboardAndFocus = () => {
		logEvent(events.ROOM_CLOSE_EMOJI);
		this.closeEmoji();
		this.focus();
	};

	closeEmojiAndAction = (action?: Function, params?: any) => {
		const { showEmojiKeyboard } = this.state;

		this.closeEmoji();
		setTimeout(() => action && action(params), showEmojiKeyboard && isIOS ? TIMEOUT_CLOSE_EMOJI : null);
	};

	submit = async () => {
		const { tshow } = this.state;
		const { onSubmit, rid: roomId, tmid, showSend, sharing } = this.props;
		const message = this.text;

		// if sharing, only execute onSubmit prop
		if (sharing) {
			onSubmit(message);
			return;
		}

		this.clearInput();
		this.debouncedOnChangeText.stop();
		this.closeEmojiKeyboardAndFocus();
		this.stopTrackingMention();
		this.handleTyping(false);
		if (message.trim() === '' && !showSend) {
			return;
		}

		const {
			editing,
			replying,
			message: { id: messageTmid },
			replyCancel
		} = this.props;

		// Slash command
		if (message[0] === MENTIONS_TRACKING_TYPE_COMMANDS) {
			const db = database.active;
			const commandsCollection = db.get('slash_commands');
			const command = message.replace(/ .*/, '').slice(1);
			const likeString = sanitizeLikeString(command);
			const slashCommand = await commandsCollection.query(Q.where('id', Q.like(`${likeString}%`))).fetch();
			if (slashCommand.length > 0) {
				logEvent(events.COMMAND_RUN);
				try {
					const messageWithoutCommand = message.replace(/([^\s]+)/, '').trim();
					const [{ appId }] = slashCommand;
					const triggerId = generateTriggerId(appId);
					await Services.runSlashCommand(command, roomId, messageWithoutCommand, triggerId, tmid || messageTmid);
					replyCancel();
				} catch (e) {
					logEvent(events.COMMAND_RUN_F);
					log(e);
				}
				this.clearInput();
				return;
			}
		}
		// Edit
		if (editing) {
			const { message: editingMessage, editRequest } = this.props;
			const {
				id,
				// @ts-ignore
				subscription: { id: rid }
			} = editingMessage;
			editRequest({ id, msg: message, rid });

			// Reply
		} else if (replying) {
			const { message: replyingMessage, threadsEnabled, replyWithMention } = this.props;

			// Thread
			if (threadsEnabled && replyWithMention) {
				onSubmit(message, replyingMessage.id, tshow);

				// Legacy reply or quote (quote is a reply without mention)
			} else {
				const msg = await this.formatReplyMessage(replyingMessage, message);
				onSubmit(msg);
			}
			replyCancel();

			// Normal message
		} else {
			// @ts-ignore
			onSubmit(message, undefined, tmid ? tshow : false);
		}
	};

	formatReplyMessage = async (replyingMessage: IMessage, message = '') => {
		const { user, roomType, replyWithMention, serverVersion } = this.props;
		const permalink = await this.getPermalink(replyingMessage);
		let msg = `[ ](${permalink}) `;

		// if original message wasn't sent by current user and neither from a direct room
		if (user.username !== replyingMessage?.u?.username && roomType !== 'd' && replyWithMention) {
			msg += `@${replyingMessage?.u?.username} `;
		}

		const connectionString = compareServerVersion(serverVersion, 'lowerThan', '5.0.0') ? ' ' : '\n';
		return `${msg}${connectionString}${message}`;
	};

	updateMentions = (keyword: any, type: string) => {
		if (type === MENTIONS_TRACKING_TYPE_USERS) {
			this.getUsers(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_EMOJIS) {
			this.getEmojis(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_COMMANDS) {
			this.getSlashCommands(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_CANNED) {
			this.getCannedResponses(keyword);
		} else {
			this.getRooms(keyword);
		}
	};

	identifyMentionKeyword = (keyword: any, type: string) => {
		this.setState({
			showEmojiKeyboard: false,
			trackingType: type,
			mentionLoading: true
		});
		this.updateMentions(keyword, type);
	};

	stopTrackingMention = () => {
		const { trackingType, showCommandPreview } = this.state;
		if (!trackingType && !showCommandPreview) {
			return;
		}
		this.setState({
			mentions: [],
			trackingType: '',
			commandPreview: [],
			showCommandPreview: false
		});
	};

	handleCommands = ({ event }: { event: any }) => {
		if (handleCommandTyping(event)) {
			if (this.focused) {
				Keyboard.dismiss();
			} else {
				this.component.focus();
			}
			this.focused = !this.focused;
		} else if (handleCommandSubmit(event)) {
			this.submit();
		} else if (handleCommandShowUpload(event)) {
			this.showMessageBoxActions();
		}
	};

	onPressSendToChannel = () => this.setState(({ tshow }) => ({ tshow: !tshow }));

	renderSendToChannel = () => {
		const { tshow } = this.state;
		const { theme, tmid, replyWithMention } = this.props;

		if (!tmid && !replyWithMention) {
			return null;
		}
		return (
			<TouchableWithoutFeedback
				style={[styles.sendToChannelButton, { backgroundColor: themes[theme].messageboxBackground }]}
				onPress={this.onPressSendToChannel}
				testID='messagebox-send-to-channel'
			>
				<CustomIcon
					testID={tshow ? 'send-to-channel-checked' : 'send-to-channel-unchecked'}
					name={tshow ? 'checkbox-checked' : 'checkbox-unchecked'}
					size={24}
					color={themes[theme].auxiliaryText}
				/>
				<Text style={[styles.sendToChannelText, { color: themes[theme].auxiliaryText }]}>
					{I18n.t('Messagebox_Send_to_channel')}
				</Text>
			</TouchableWithoutFeedback>
		);
	};

	renderEmojiSearchbar = () => {
		const { showEmojiSearchbar } = this.state;

		return showEmojiSearchbar ? (
			<EmojiSearchbar
				openEmoji={this.openEmoji}
				closeEmoji={this.closeEmoji}
				onEmojiSelected={(emoji: IEmoji) => {
					this.onKeyboardItemSelected('EmojiKeyboard', { eventType: EventTypes.EMOJI_PRESSED, emoji });
				}}
			/>
		) : null;
	};

	handleBackPress = () => {
		const { showEmojiSearchbar } = this.state;
		if (showEmojiSearchbar) {
			this.setState({ showEmojiSearchbar: false });
			return true;
		}
		return false;
	};

	renderContent = () => {
		const {
			recording,
			showEmojiKeyboard,
			showEmojiSearchbar,
			showSend,
			mentions,
			trackingType,
			commandPreview,
			showCommandPreview,
			mentionLoading,
			permissionToUpload
		} = this.state;
		const {
			editing,
			message,
			replying,
			replyCancel,
			user,
			getCustomEmoji,
			theme,
			Message_AudioRecorderEnabled,
			children,
			isActionsEnabled,
			tmid
		} = this.props;

		const isAndroidTablet: Partial<IThemedTextInput> =
			isTablet && isAndroid
				? {
						multiline: false,
						onSubmitEditing: this.submit,
						returnKeyType: 'send'
				  }
				: {};

		const recordAudio =
			showSend || !Message_AudioRecorderEnabled ? null : (
				<RecordAudio
					theme={theme}
					recordingCallback={this.recordingCallback}
					onFinish={this.finishAudioMessage}
					permissionToUpload={permissionToUpload}
					onStart={this.closeEmoji}
				/>
			);

		const commandsPreviewAndMentions = !recording ? (
			<>
				<CommandsPreview commandPreview={commandPreview} showCommandPreview={showCommandPreview} />
				<Mentions mentions={mentions} trackingType={trackingType} loading={mentionLoading} />
			</>
		) : null;

		const replyPreview = !recording ? (
			<ReplyPreview
				message={message}
				close={replyCancel}
				username={user.username}
				replying={replying}
				getCustomEmoji={getCustomEmoji}
			/>
		) : null;

		const textInputAndButtons = !recording ? (
			<>
				<LeftButtons
					showEmojiKeyboard={showEmojiKeyboard || showEmojiSearchbar}
					editing={editing}
					editCancel={this.editCancel}
					openEmoji={this.openEmoji}
					closeEmoji={this.closeEmojiKeyboardAndFocus}
				/>
				<TextInput
					ref={component => (this.component = component)}
					style={[styles.textBoxInput, { color: themes[theme].bodyText }]}
					returnKeyType='default'
					keyboardType='twitter'
					blurOnSubmit={false}
					placeholder={I18n.t('New_Message')}
					placeholderTextColor={themes[theme].auxiliaryText}
					onChangeText={this.onChangeText}
					onSelectionChange={this.onSelectionChange}
					underlineColorAndroid='transparent'
					defaultValue=''
					multiline
					testID={`messagebox-input${tmid ? '-thread' : ''}`}
					{...isAndroidTablet}
				/>
				<RightButtons
					showSend={showSend}
					submit={this.submit}
					showMessageBoxActions={this.showMessageBoxActions}
					isActionsEnabled={isActionsEnabled}
				/>
			</>
		) : null;

		return (
			<>
				{commandsPreviewAndMentions}
				<View style={[styles.composer, { borderTopColor: themes[theme].borderColor }]}>
					{replyPreview}
					<View
						style={[
							styles.textArea,
							{ backgroundColor: themes[theme].messageboxBackground },
							!recording && editing && { backgroundColor: themes[theme].chatComponentBackground }
						]}
						testID='messagebox'
					>
						{textInputAndButtons}
						{recordAudio}
					</View>
					{this.renderSendToChannel()}
					{this.renderEmojiSearchbar()}
				</View>
				{children}
			</>
		);
	};

	render() {
		console.count(`${this.constructor.name}.render calls`);
		const { showEmojiKeyboard } = this.state;
		const { user, baseUrl, theme, iOSScrollBehavior } = this.props;
		return (
			<MessageboxContext.Provider
				value={{
					user,
					baseUrl,
					onPressMention: this.onPressMention,
					onPressCommandPreview: this.onPressCommandPreview,
					onPressNoMatchCanned: this.onPressNoMatchCanned
				}}
			>
				<KeyboardAccessoryView
					ref={(ref: any) => (this.tracking = ref)}
					renderContent={this.renderContent}
					kbInputRef={this.component}
					kbComponent={showEmojiKeyboard ? 'EmojiKeyboard' : null}
					kbInitialProps={{ theme }}
					onKeyboardResigned={this.onKeyboardResigned}
					onItemSelected={this.onKeyboardItemSelected}
					trackInteractive
					requiresSameParentToManageScrollView
					addBottomView
					bottomViewColor={themes[theme].messageboxBackground}
					iOSScrollBehavior={iOSScrollBehavior}
				/>
			</MessageboxContext.Provider>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	isMasterDetail: state.app.isMasterDetail,
	baseUrl: state.server.server,
	threadsEnabled: state.settings.Threads_enabled,
	user: getUserSelector(state),
	FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize,
	Message_AudioRecorderEnabled: state.settings.Message_AudioRecorderEnabled,
	uploadFilePermission: state.permissions['mobile-upload-file'],
	serverVersion: state.server.version
});

const dispatchToProps = {
	typing: (rid: any, status: any) => userTypingAction(rid, status)
};

export type MessageBoxType = MessageBox;

export default connect(mapStateToProps, dispatchToProps, null, { forwardRef: true })(withActionSheet(MessageBox));
