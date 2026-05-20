import React, { Component } from 'react';
import { type NativeStackNavigationOptions, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type RouteProp } from '@react-navigation/native';
import { Keyboard, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';
import { type Dispatch } from 'redux';

import { compareServerVersion } from '../../lib/methods/helpers/compareServerVersion';
import { type IMessageComposerRef, MessageComposerContainer } from '../../containers/MessageComposer';
import { type InsideStackParamList } from '../../stacks/types';
import { themes } from '../../lib/constants/colors';
import I18n from '../../i18n';
import { prepareQuoteMessage } from '../../containers/MessageComposer/helpers';
import { sendLoadingEvent } from '../../containers/Loading';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import { type TSupportedThemes, withTheme } from '../../theme';
import { FormTextInput } from '../../containers/TextInput';
import SafeAreaView from '../../containers/SafeAreaView';
import { getUserSelector } from '../../selectors/login';
import database from '../../lib/database';
import Thumbs from '../../containers/Thumbs';
import { showActionSheetRef } from '../../containers/ActionSheet';
import { AttachmentActionSheet } from '../../containers/MessageComposer/components/Attachments/AttachmentActionSheet';
import Preview from './Preview';
import Header from './Header';
import styles from './styles';
import {
	type IApplicationState,
	type IServer,
	type IShareAttachment,
	type IUser,
	RootEnum,
	type TMessageAction,
	type TSubscriptionModel,
	type TThreadModel
} from '../../definitions';
import { sendAttachments } from '../../lib/methods/sendFileMessage/sendAttachments';
import { sendMessage } from '../../lib/methods/sendMessage';
import { hasPermission, isAndroid, canUploadFile, isReadOnly, isBlocked } from '../../lib/methods/helpers';
import { RoomContext } from '../RoomView/context';
import { appStart } from '../../actions/app';

interface IShareViewState {
	selected: IShareAttachment;
	loading: boolean;
	readOnly: boolean;
	attachments: IShareAttachment[];
	text: string;
	room: TSubscriptionModel;
	thread: TThreadModel | string;
	maxFileSize?: number;
	mediaAllowList?: string;
	selectedMessages: string[];
	action: TMessageAction;
}

interface IShareViewProps {
	navigation: NativeStackNavigationProp<InsideStackParamList, 'ShareView'>;
	route: RouteProp<InsideStackParamList, 'ShareView'>;
	theme: TSupportedThemes;
	user: {
		id: string;
		username: string;
		token: string;
	};
	server: string;
	serverVersion?: string;
	FileUpload_MediaTypeWhiteList?: string;
	FileUpload_MaxFileSize?: number;
	dispatch: Dispatch;
}

type TShareServerInfo = Partial<Pick<IServer, 'version' | 'FileUpload_MaxFileSize' | 'FileUpload_MediaTypeWhiteList'>>;

class ShareView extends Component<IShareViewProps, IShareViewState> {
	private messageComposerRef: React.RefObject<IMessageComposerRef | null>;
	private files: any[];
	private isShareExtension: boolean;
	private serverInfo: TShareServerInfo;
	private finishShareView: (text?: string, selectedMessages?: string[]) => void;
	private sentMessage: boolean;

	constructor(props: IShareViewProps) {
		super(props);
		this.messageComposerRef = React.createRef();
		this.files = props.route.params?.attachments ?? [];
		this.isShareExtension = props.route.params?.isShareExtension;
		this.serverInfo = props.route.params?.serverInfo ?? {};
		this.finishShareView = props.route.params?.finishShareView;
		this.sentMessage = false;

		this.state = {
			selected: {} as IShareAttachment,
			loading: false,
			readOnly: false,
			attachments: [],
			text: props.route.params?.text ?? '',
			room: props.route.params?.room ?? {},
			thread: props.route.params?.thread ?? {},
			maxFileSize: this.isShareExtension ? this.serverInfo?.FileUpload_MaxFileSize : props.FileUpload_MaxFileSize,
			mediaAllowList: this.isShareExtension
				? this.serverInfo?.FileUpload_MediaTypeWhiteList
				: props.FileUpload_MediaTypeWhiteList,
			selectedMessages: [],
			action: props.route.params?.action
		};
		this.getServerInfo();
	}

	componentDidMount = async () => {
		const readOnly = await this.getReadOnly();
		const { attachments, selected } = await this.getAttachments();
		this.setState({ readOnly, attachments, selected }, () => this.setHeader());
		this.startShareView();
	};

	componentWillUnmount = () => {
		console.countReset(`${this.constructor.name}.render calls`);
		if (this.finishShareView && !this.sentMessage) {
			const text = this.messageComposerRef.current?.getText();
			this.finishShareView(text, this.state.selectedMessages);
		}
	};

	getThreadId = (thread: TThreadModel | string | undefined) => {
		let threadId = undefined;
		if (typeof thread === 'object') {
			threadId = thread?.id;
		} else if (typeof thread === 'string') {
			threadId = thread;
		}
		return threadId;
	};

	setHeader = () => {
		const { room, thread, readOnly, attachments } = this.state;
		const { navigation, theme } = this.props;

		const options: NativeStackNavigationOptions = {
			headerTitle: () => <Header room={room} thread={thread} />
		};

		// if is share extension show default back button
		if (!this.isShareExtension) {
			options.headerLeft = () => (
				<HeaderButton.CloseModal navigation={navigation} color={themes[theme].fontDefault} testID='share-view-close' />
			);
		}

		if (!attachments.length && !readOnly) {
			options.headerRight = () => (
				<HeaderButton.Container>
					<HeaderButton.Item title={I18n.t('Send')} onPress={this.send} color={themes[theme].fontDefault} />
				</HeaderButton.Container>
			);
		}

		navigation.setOptions(options);
	};

	// fetch server info
	getServerInfo = async () => {
		const { server } = this.props;
		const serversDB = database.servers;
		const serversCollection = serversDB.get('servers');
		try {
			this.serverInfo = await serversCollection.find(server);
		} catch (error) {
			// Do nothing
		}
	};

	getPermissionMobileUpload = async () => {
		const { room } = this.state;
		const db = database.active;
		const permissionsCollection = db.get('permissions');
		const uploadFilePermissionFetch = await permissionsCollection.query(Q.where('id', Q.like('mobile-upload-file'))).fetch();
		const uploadFilePermission = uploadFilePermissionFetch[0]?.roles;
		const permissionToUpload = await hasPermission([uploadFilePermission], room.rid);
		// uploadFilePermission as undefined is considered that there isn't this permission, so all can upload file.
		return !uploadFilePermission || permissionToUpload[0];
	};

	getReadOnly = async () => {
		const { room } = this.state;
		const { user } = this.props;
		const readOnly = await isReadOnly(room, user.username);
		return readOnly;
	};

	getAttachments = async () => {
		const { mediaAllowList, maxFileSize } = this.state;
		const permissionToUploadFile = await this.getPermissionMobileUpload();

		const items = await Promise.all(
			this.files.map(async item => {
				// Check server settings
				const { success: canUpload, error } = canUploadFile({
					file: item,
					allowList: mediaAllowList,
					maxFileSize,
					permissionToUploadFile
				});
				item.canUpload = canUpload;
				item.error = error;

				// get video thumbnails
				if (isAndroid && this.files.length > 1 && item.mime?.match?.(/video/)) {
					try {
						const VideoThumbnails = require('expo-video-thumbnails');
						const { uri } = await VideoThumbnails.getThumbnailAsync(item.path);
						item.uri = uri;
					} catch {
						// Do nothing
					}
				}

				// Set a filename, if there isn't any
				if (!item.filename) {
					item.filename = item?.path?.split('/')?.pop();
				}
				return item;
			})
		);
		return {
			attachments: items,
			selected: items[0]
		};
	};

	startShareView = async () => {
		const startShareView = this.props.route.params?.startShareView;
		if (startShareView) {
			const { selectedMessages, text } = startShareView();
			// Synchronization needed for Fabric to work
			await new Promise(resolve => setTimeout(resolve, 100));
			this.messageComposerRef.current?.setInput(text);
			this.setState({ selectedMessages });
		}
	};

	send = async () => {
		if (this.state.loading) return;

		Keyboard.dismiss();

		const { attachments, room, text, thread, action, selectedMessages } = this.state;
		const { navigation, server, user, dispatch } = this.props;
		// flush the composer caption into the selected attachment before sending
		this.saveSelectedDescription();

		// if it's share extension this should show loading
		if (this.isShareExtension) {
			this.setState({ loading: true });
			sendLoadingEvent({ visible: true });

			// if it's not share extension this can close
		} else {
			this.sentMessage = true;
			this.finishShareView('', []);
			navigation.pop();
		}

		let msg: string | undefined;
		if (action === 'quote') {
			msg = await prepareQuoteMessage('', selectedMessages);
		}

		const { isAltTextSupported } = this;

		try {
			// Send attachment
			if (attachments.length) {
				// On server >= 8.4, description = alt text; caption moves to msg
				await sendAttachments({
					attachments,
					rid: room.rid,
					tmid: this.getThreadId(thread),
					server,
					user: { id: user.id, token: user.token },
					altTextSupported: isAltTextSupported,
					getMsg: ({ description }) => (isAltTextSupported ? description || msg : msg)
				});

				// Send text message
			} else if (text.length) {
				await sendMessage(room.rid, text, this.getThreadId(thread), {
					id: user.id,
					token: user.token
				} as IUser);
			}
		} catch {
			if (!this.isShareExtension) {
				const text = this.messageComposerRef.current?.getText();
				this.finishShareView(text, this.state.selectedMessages);
			}
		}

		// if it's share extension this should close
		if (this.isShareExtension) {
			sendLoadingEvent({ visible: false });
			dispatch(appStart({ root: RootEnum.ROOT_INSIDE }));
		}
	};

	// Persist the composer caption into the currently selected attachment's description
	saveSelectedDescription = () => {
		const { attachments, selected } = this.state;
		const text = this.messageComposerRef.current?.getText();
		attachments.forEach(att => {
			if (att.path === selected.path) {
				att.description = text;
			}
		});
	};

	updateAttachment = (path: string, updated: Partial<IShareAttachment>) => {
		this.setState(({ attachments }) => ({
			attachments: attachments.map(att => (att.path === path ? { ...att, ...updated } : att))
		}));
	};

	openAltTextSheet = (attachment: IShareAttachment) => {
		showActionSheetRef({
			children: (
				<AttachmentActionSheet attachment={attachment} onSave={updated => this.updateAttachment(attachment.path, updated)} />
			),
			snaps: ['85%'],
			fullContainer: true
		});
	};

	selectFile = (item: IShareAttachment) => {
		const { attachments } = this.state;
		if (attachments.length > 0) {
			this.saveSelectedDescription();
			this.setState({ selected: item });
			this.messageComposerRef.current?.setInput(item.description || '');
			this.openAltTextSheet(item);
		}
	};

	removeFile = (item: IShareAttachment) => {
		const { selected, attachments } = this.state;
		let newSelected = selected;
		if (item.path === selected.path) {
			const selectedIndex = attachments.findIndex(att => att.path === selected.path);
			// Selects the next one, if available
			if (attachments[selectedIndex + 1]?.path) {
				newSelected = attachments[selectedIndex + 1];
				// If it's the last thumb, selects the previous one
			} else {
				newSelected = attachments[selectedIndex - 1] || {};
			}
			this.setState({
				attachments: attachments.filter(att => att.path !== item.path),
				selected: newSelected
			});
			this.messageComposerRef.current?.setInput(newSelected.description || '');
			return;
		}
		this.setState({ attachments: attachments.filter(att => att.path !== item.path), selected: newSelected });
		this.messageComposerRef.current?.setInput(newSelected.description || '');
	};

	onChangeText = (text: string) => {
		this.setState({ text });
	};

	private get effectiveServerVersion(): string | undefined {
		const { serverVersion } = this.props;
		// Share extension targets a specific workspace; prefer its version over the Redux-connected server
		return this.isShareExtension ? this.serverInfo.version || serverVersion : serverVersion || this.serverInfo.version;
	}

	private get isAltTextSupported(): boolean {
		return compareServerVersion(this.effectiveServerVersion, 'greaterThanOrEqualTo', '8.4.0');
	}

	onRemoveQuoteMessage = (messageId: string) => {
		const { selectedMessages } = this.state;
		const newSelectedMessages = selectedMessages.filter(item => item !== messageId);
		this.setState({ selectedMessages: newSelectedMessages, action: newSelectedMessages.length ? 'quote' : null });
	};

	renderContent = () => {
		const { attachments, selected, text, room, thread, selectedMessages } = this.state;
		const { theme, route } = this.props;

		if (attachments.length) {
			return (
				<RoomContext.Provider
					value={{
						rid: room.rid,
						t: room.t,
						room,
						tmid: this.getThreadId(thread),
						sharing: true,
						action: route.params?.action,
						selectedMessages,
						onSendMessage: this.send,
						onRemoveQuoteMessage: this.onRemoveQuoteMessage
					}}>
					<View style={styles.container}>
						<Preview
							// using key just to reset zoom/move after change selected
							key={selected?.path}
							item={selected}
							length={attachments.length}
							theme={theme}
						/>
						<MessageComposerContainer ref={this.messageComposerRef}>
							<Thumbs attachments={attachments} onPress={this.selectFile} onRemove={this.removeFile} />
						</MessageComposerContainer>
					</View>
				</RoomContext.Provider>
			);
		}

		return (
			<FormTextInput
				containerStyle={styles.inputContainer}
				inputStyle={[styles.input, styles.textInput, { backgroundColor: themes[theme].surfaceLight }]}
				placeholder=''
				onChangeText={this.onChangeText}
				defaultValue=''
				multiline
				textAlignVertical='top'
				autoFocus
				value={text}
			/>
		);
	};

	render() {
		console.count(`${this.constructor.name}.render calls`);
		const { readOnly, room } = this.state;
		const { theme } = this.props;
		if (readOnly || isBlocked(room)) {
			return (
				<View style={[styles.container, styles.centered, { backgroundColor: themes[theme].surfaceHover }]} testID='share-view'>
					<Text style={[styles.title, { color: themes[theme].fontTitlesLabels }]}>
						{isBlocked(room) ? I18n.t('This_room_is_blocked') : I18n.t('This_room_is_read_only')}
					</Text>
				</View>
			);
		}
		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID='share-view'>
				{this.renderContent()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	server: state.server.server,
	serverVersion: state.server.version,
	FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList as string,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize as number
});

export { ShareView };
export default connect(mapStateToProps)(withTheme(ShareView));
