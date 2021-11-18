import React, { Component } from 'react';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { NativeModules, Text, View } from 'react-native';
import { connect } from 'react-redux';
import ShareExtension from 'rn-extensions-share';

import { themes } from '../../constants/colors';
import I18n from '../../i18n';
import Loading from '../../containers/Loading';
import * as HeaderButton from '../../containers/HeaderButton';
import { isBlocked } from '../../utils/room';
import { isReadOnly } from '../../utils/isReadOnly';
import { withTheme } from '../../theme';
import RocketChat from '../../lib/rocketchat';
import TextInput from '../../containers/TextInput';
import MessageBox from '../../containers/MessageBox';
import SafeAreaView from '../../containers/SafeAreaView';
import { getUserSelector } from '../../selectors/login';
import StatusBar from '../../containers/StatusBar';
import database from '../../lib/database';
import { canUploadFile } from '../../utils/media';
import { isAndroid } from '../../utils/deviceInfo';
import Thumbs from './Thumbs';
import Preview from './Preview';
import Header from './Header';
import styles from './styles';
import { IAttachment, IServer } from './interfaces';

interface IShareViewState {
	selected: IAttachment;
	loading: boolean;
	readOnly: boolean;
	attachments: IAttachment[];
	text: string;
	// TODO: Refactor when migrate room
	room: any;
	thread: any;
	maxFileSize: number;
	mediaAllowList: number;
}

interface IShareViewProps {
	// TODO: Refactor after react-navigation
	navigation: StackNavigationProp<any, 'ShareView'>;
	route: RouteProp<
		{
			ShareView: {
				attachments: IAttachment[];
				isShareView?: boolean;
				isShareExtension: boolean;
				serverInfo: IServer;
				text: string;
				room: any;
				thread: any; // change
			};
		},
		'ShareView'
	>;
	theme: string;
	user: {
		id: string;
		username: string;
		token: string;
	};
	server: string;
	FileUpload_MediaTypeWhiteList?: number;
	FileUpload_MaxFileSize?: number;
}

interface IMessageBoxShareView {
	text: string;
	forceUpdate(): void;
}

class ShareView extends Component<IShareViewProps, IShareViewState> {
	private messagebox: React.RefObject<IMessageBoxShareView>;
	private files: any[];
	private isShareExtension: boolean;
	private serverInfo: any;

	constructor(props: IShareViewProps) {
		super(props);
		this.messagebox = React.createRef();
		this.files = props.route.params?.attachments ?? [];
		this.isShareExtension = props.route.params?.isShareExtension;
		this.serverInfo = props.route.params?.serverInfo ?? {};

		this.state = {
			selected: {} as IAttachment,
			loading: false,
			readOnly: false,
			attachments: [],
			text: props.route.params?.text ?? '',
			room: props.route.params?.room ?? {},
			thread: props.route.params?.thread ?? {},
			maxFileSize: this.isShareExtension ? this.serverInfo?.FileUpload_MaxFileSize : props.FileUpload_MaxFileSize,
			mediaAllowList: this.isShareExtension ? this.serverInfo?.FileUpload_MediaTypeWhiteList : props.FileUpload_MediaTypeWhiteList
		};
		this.getServerInfo();
	}

	componentDidMount = async () => {
		const readOnly = await this.getReadOnly();
		const { attachments, selected } = await this.getAttachments();
		this.setState({ readOnly, attachments, selected }, () => this.setHeader());
	};

	componentWillUnmount = () => {
		console.countReset(`${this.constructor.name}.render calls`);
	};

	setHeader = () => {
		const { room, thread, readOnly, attachments } = this.state;
		const { navigation, theme } = this.props;

		const options: StackNavigationOptions = {
			headerTitle: () => <Header room={room} thread={thread} />,
			headerTitleAlign: 'left',
			headerTintColor: themes[theme].previewTintColor
		};

		// if is share extension show default back button
		if (!this.isShareExtension) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		if (!attachments.length && !readOnly) {
			options.headerRight = () => (
				<HeaderButton.Container>
					<HeaderButton.Item
						title={I18n.t('Send')}
						onPress={this.send}
						buttonStyle={[styles.send, { color: themes[theme].previewTintColor }]}
					/>
				</HeaderButton.Container>
			);
		}

		options.headerBackground = () => <View style={[styles.container, { backgroundColor: themes[theme].previewBackground }]} />;

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

	getReadOnly = async () => {
		const { room } = this.state;
		const { user } = this.props;
		const readOnly = await isReadOnly(room, user);
		return readOnly;
	};

	getAttachments = async () => {
		const { mediaAllowList, maxFileSize } = this.state;
		const items = await Promise.all(
			this.files.map(async item => {
				// Check server settings
				const { success: canUpload, error } = canUploadFile(item, mediaAllowList, maxFileSize);
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
					item.filename = new Date().toISOString();
				}
				return item;
			})
		);
		return {
			attachments: items,
			selected: items[0]
		};
	};

	send = async () => {
		const { loading, selected } = this.state;
		if (loading) {
			return;
		}

		// update state
		await this.selectFile(selected);

		const { attachments, room, text, thread } = this.state;
		const { navigation, server, user } = this.props;

		// if it's share extension this should show loading
		if (this.isShareExtension) {
			this.setState({ loading: true });

			// if it's not share extension this can close
		} else {
			navigation.pop();
		}

		try {
			// Send attachment
			if (attachments.length) {
				await Promise.all(
					attachments.map(({ filename: name, mime: type, description, size, path, canUpload }) => {
						if (canUpload) {
							return RocketChat.sendFileMessage(
								room.rid,
								{
									name,
									description,
									size,
									type,
									path,
									store: 'Uploads'
								},
								thread?.id,
								server,
								{ id: user.id, token: user.token }
							);
						}
						return Promise.resolve();
					})
				);

				// Send text message
			} else if (text.length) {
				await RocketChat.sendMessage(room.rid, text, thread?.id, { id: user.id, token: user.token });
			}
		} catch {
			// Do nothing
		}

		// if it's share extension this should close
		if (this.isShareExtension) {
			ShareExtension.close();
		}
	};

	selectFile = (item: IAttachment) => {
		const { attachments, selected } = this.state;
		if (attachments.length > 0) {
			const text = this.messagebox.current?.text;
			const newAttachments = attachments.map(att => {
				if (att.path === selected.path) {
					att.description = text;
				}
				return att;
			});
			return this.setState({ attachments: newAttachments, selected: item });
		}
	};

	removeFile = (item: IAttachment) => {
		const { selected, attachments } = this.state;
		let newSelected;
		if (item.path === selected.path) {
			const selectedIndex = attachments.findIndex(att => att.path === selected.path);
			// Selects the next one, if available
			if (attachments[selectedIndex + 1]?.path) {
				newSelected = attachments[selectedIndex + 1];
				// If it's the last thumb, selects the previous one
			} else {
				newSelected = attachments[selectedIndex - 1] || {};
			}
		}
		this.setState({ attachments: attachments.filter(att => att.path !== item.path), selected: newSelected ?? selected }, () => {
			this.messagebox?.current?.forceUpdate?.();
		});
	};

	onChangeText = (text: string) => {
		this.setState({ text });
	};

	renderContent = () => {
		const { attachments, selected, room, text } = this.state;
		const { theme, navigation } = this.props;

		if (attachments.length) {
			return (
				<View style={styles.container}>
					<Preview
						// using key just to reset zoom/move after change selected
						key={selected?.path}
						item={selected}
						length={attachments.length}
						theme={theme}
						isShareExtension={this.isShareExtension}
					/>
					<MessageBox
						showSend
						sharing
						ref={this.messagebox}
						rid={room.rid}
						roomType={room.t}
						theme={theme}
						onSubmit={this.send}
						message={{ msg: selected?.description ?? '' }}
						navigation={navigation}
						isFocused={navigation.isFocused}
						iOSScrollBehavior={NativeModules.KeyboardTrackingViewManager?.KeyboardTrackingScrollBehaviorNone}
						isActionsEnabled={false}>
						<Thumbs
							attachments={attachments}
							theme={theme}
							isShareExtension={this.isShareExtension}
							onPress={this.selectFile}
							onRemove={this.removeFile}
						/>
					</MessageBox>
				</View>
			);
		}

		return (
			<TextInput
				containerStyle={styles.inputContainer}
				inputStyle={[styles.input, styles.textInput, { backgroundColor: themes[theme].focusedBackground }]}
				placeholder=''
				onChangeText={this.onChangeText}
				defaultValue=''
				multiline
				textAlignVertical='top'
				autoFocus
				theme={theme}
				value={text}
			/>
		);
	};

	render() {
		console.count(`${this.constructor.name}.render calls`);
		const { readOnly, room, loading } = this.state;
		const { theme } = this.props;
		if (readOnly || isBlocked(room)) {
			return (
				<View style={[styles.container, styles.centered, { backgroundColor: themes[theme].backgroundColor }]}>
					<Text style={[styles.title, { color: themes[theme].titleText }]}>
						{isBlocked(room) ? I18n.t('This_room_is_blocked') : I18n.t('This_room_is_read_only')}
					</Text>
				</View>
			);
		}
		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }}>
				<StatusBar barStyle='light-content' backgroundColor={themes[theme].previewBackground} />
				{this.renderContent()}
				<Loading visible={loading} />
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: any) => ({
	user: getUserSelector(state),
	server: state.share.server.server || state.server.server,
	FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize
});

export default connect(mapStateToProps)(withTheme(ShareView));
