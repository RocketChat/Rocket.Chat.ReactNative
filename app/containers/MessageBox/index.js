import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, FlatList, Text, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';
import { emojify } from 'react-emojione';
import { KeyboardAccessoryView } from 'react-native-keyboard-input';
import ImagePicker from 'react-native-image-crop-picker';

import { userTyping } from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import { editRequest, editCancel, replyCancel } from '../../actions/messages';
import styles from './styles';
import MyIcon from '../icons';
import database from '../../lib/realm';
import Avatar from '../Avatar';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { emojis } from '../../emojis';
import Recording from './Recording';
import FilesActions from './FilesActions';
import UploadModal from './UploadModal';
import './EmojiKeyboard';
import log from '../../utils/log';
import I18n from '../../i18n';
import ReplyPreview from './ReplyPreview';

const MENTIONS_TRACKING_TYPE_USERS = '@';
const MENTIONS_TRACKING_TYPE_EMOJIS = ':';

const onlyUnique = function onlyUnique(value, index, self) {
	return self.indexOf(({ _id }) => value._id === _id) === index;
};

const imagePickerConfig = {
	cropping: true,
	compressImageQuality: 0.8,
	cropperAvoidEmptySpaceAroundImage: false,
	cropperChooseText: I18n.t('Choose'),
	cropperCancelText: I18n.t('Cancel')
};

@connect(state => ({
	roomType: state.room.t,
	message: state.messages.message,
	replyMessage: state.messages.replyMessage,
	replying: state.messages.replyMessage && !!state.messages.replyMessage.msg,
	editing: state.messages.editing,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	username: state.login.user && state.login.user.username
}), dispatch => ({
	editCancel: () => dispatch(editCancel()),
	editRequest: message => dispatch(editRequest(message)),
	typing: status => dispatch(userTyping(status)),
	closeReply: () => dispatch(replyCancel())
}))
export default class MessageBox extends React.PureComponent {
	static propTypes = {
		rid: PropTypes.string.isRequired,
		baseUrl: PropTypes.string.isRequired,
		message: PropTypes.object,
		replyMessage: PropTypes.object,
		replying: PropTypes.bool,
		editing: PropTypes.bool,
		username: PropTypes.string,
		roomType: PropTypes.string,
		editCancel: PropTypes.func.isRequired,
		editRequest: PropTypes.func.isRequired,
		onSubmit: PropTypes.func.isRequired,
		typing: PropTypes.func,
		closeReply: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			text: '',
			mentions: [],
			showEmojiKeyboard: false,
			showFilesAction: false,
			recording: false,
			file: {
				isVisible: false
			}
		};
		this.users = [];
		this.rooms = [];
		this.emojis = [];
		this.customEmojis = [];
		this._onEmojiSelected = this._onEmojiSelected.bind(this);
	}
	componentWillReceiveProps(nextProps) {
		if (this.props.message !== nextProps.message && nextProps.message.msg) {
			this.setState({ text: nextProps.message.msg });
			this.component.focus();
		} else if (this.props.replyMessage !== nextProps.replyMessage && nextProps.replyMessage.msg) {
			this.component.focus();
		} else if (!nextProps.message) {
			this.setState({ text: '' });
		}
	}

	onChangeText(text) {
		this.setState({ text });
		this.props.typing(text.length > 0);

		requestAnimationFrame(() => {
			const { start, end } = this.component._lastNativeSelection;

			const cursor = Math.max(start, end);

			const lastNativeText = this.component._lastNativeText;

			const regexp = /(#|@|:)([a-z0-9._-]+)$/im;

			const result = lastNativeText.substr(0, cursor).match(regexp);
			if (!result) {
				return this.stopTrackingMention();
			}
			const [, lastChar, name] = result;

			this.identifyMentionKeyword(name, lastChar);
		});
	}

	onKeyboardResigned() {
		this.closeEmoji();
	}

	get leftButtons() {
		const { editing } = this.props;
		if (editing) {
			return (<Icon
				style={styles.actionButtons}
				name='close'
				accessibilityLabel={I18n.t('Cancel_editing')}
				accessibilityTraits='button'
				onPress={() => this.editCancel()}
				testID='messagebox-cancel-editing'
			/>);
		}
		return !this.state.showEmojiKeyboard ? (<Icon
			style={styles.actionButtons}
			onPress={() => this.openEmoji()}
			accessibilityLabel={I18n.t('Open_emoji_selector')}
			accessibilityTraits='button'
			name='mood'
			testID='messagebox-open-emoji'
		/>) : (<Icon
			onPress={() => this.closeEmoji()}
			style={styles.actionButtons}
			accessibilityLabel={I18n.t('Close_emoji_selector')}
			accessibilityTraits='button'
			name='keyboard'
			testID='messagebox-close-emoji'
		/>);
	}
	get rightButtons() {
		const icons = [];

		if (this.state.text) {
			icons.push(<MyIcon
				style={[styles.actionButtons, { color: '#1D74F5' }]}
				name='send'
				key='sendIcon'
				accessibilityLabel={I18n.t('Send message')}
				accessibilityTraits='button'
				onPress={() => this.submit(this.state.text)}
				testID='messagebox-send-message'
			/>);
			return icons;
		}
		icons.push(<Icon
			style={[styles.actionButtons, { color: '#1D74F5', paddingHorizontal: 10 }]}
			name='mic'
			key='micIcon'
			accessibilityLabel={I18n.t('Send audio message')}
			accessibilityTraits='button'
			onPress={() => this.recordAudioMessage()}
			testID='messagebox-send-audio'
		/>);
		icons.push(<MyIcon
			style={[styles.actionButtons, { color: '#2F343D', fontSize: 16 }]}
			name='plus'
			key='fileIcon'
			accessibilityLabel={I18n.t('Message actions')}
			accessibilityTraits='button'
			onPress={this.toggleFilesActions}
			testID='messagebox-actions'
		/>);
		return icons;
	}

	getPermalink = async(message) => {
		try {
			return await RocketChat.getPermalink(message);
		} catch (error) {
			return null;
		}
	}

	toggleFilesActions = () => {
		this.setState(prevState => ({ showFilesAction: !prevState.showFilesAction }));
	}

	sendImageMessage = async(file) => {
		this.setState({ file: { isVisible: false } });
		const fileInfo = {
			name: file.name,
			description: file.description,
			size: file.size,
			type: file.mime,
			store: 'Uploads',
			path: file.path
		};
		try {
			await RocketChat.sendFileMessage(this.props.rid, fileInfo);
		} catch (e) {
			log('sendImageMessage', e);
		}
	}

	takePhoto = async() => {
		try {
			const image = await ImagePicker.openCamera(imagePickerConfig);
			this.showUploadModal(image);
		} catch (e) {
			log('takePhoto', e);
		}
	}

	chooseFromLibrary = async() => {
		try {
			const image = await ImagePicker.openPicker(imagePickerConfig);
			this.showUploadModal(image);
		} catch (e) {
			log('chooseFromLibrary', e);
		}
	}

	showUploadModal = (file) => {
		this.setState({ file: { ...file, isVisible: true } });
	}

	editCancel() {
		this.props.editCancel();
		this.setState({ text: '' });
	}

	async openEmoji() {
		await this.setState({
			showEmojiKeyboard: true
		});
	}

	async recordAudioMessage() {
		const recording = await Recording.permission();
		this.setState({ recording });
	}

	finishAudioMessage = async(fileInfo) => {
		this.setState({
			recording: false
		});
		if (fileInfo) {
			try {
				await RocketChat.sendFileMessage(this.props.rid, fileInfo);
			} catch (e) {
				if (e && e.error === 'error-file-too-large') {
					return Alert.alert('File is too large!');
				}
				log('finishAudioMessage', e);
			}
		}
	}

	closeEmoji() {
		this.setState({ showEmojiKeyboard: false });
	}

	async submit(message) {
		this.setState({ text: '' });
		this.closeEmoji();
		this.stopTrackingMention();
		this.props.typing(false);
		if (message.trim() === '') {
			return;
		}
		// if is editing a message
		const {
			editing, replying
		} = this.props;

		if (editing) {
			const { _id, rid } = this.props.message;
			this.props.editRequest({ _id, msg: message, rid });
		} else if (replying) {
			const {
				username, replyMessage, roomType, closeReply
			} = this.props;
			const permalink = await this.getPermalink(replyMessage);
			let msg = `[ ](${ permalink }) `;

			// if original message wasn't sent by current user and neither from a direct room
			if (username !== replyMessage.u.username && roomType !== 'd' && replyMessage.mention) {
				msg += `@${ replyMessage.u.username } `;
			}

			msg = `${ msg } ${ message }`;
			this.props.onSubmit(msg);
			closeReply();
		} else {
			// if is submiting a new message
			this.props.onSubmit(message);
		}
	}

	_getFixedMentions(keyword) {
		if ('all'.indexOf(keyword) !== -1) {
			this.users = [{ _id: -1, username: 'all' }, ...this.users];
		}
		if ('here'.indexOf(keyword) !== -1) {
			this.users = [{ _id: -2, username: 'here' }, ...this.users];
		}
	}

	async _getUsers(keyword) {
		this.users = database.objects('users');
		if (keyword) {
			this.users = this.users.filtered('username CONTAINS[c] $0', keyword);
		}
		this._getFixedMentions(keyword);
		this.setState({ mentions: this.users.slice() });

		const usernames = [];

		if (keyword && this.users.length > 7) {
			return;
		}

		this.users.forEach(user => usernames.push(user.username));

		if (this.oldPromise) {
			this.oldPromise();
		}
		try {
			const results = await Promise.race([
				RocketChat.spotlight(keyword, usernames, { users: true }),
				new Promise((resolve, reject) => (this.oldPromise = reject))
			]);
			if (results.users && results.users.length) {
				database.write(() => {
					results.users.forEach((user) => {
						database.create('users', user, true);
					});
				});
			}
		} catch (e) {
			console.warn('spotlight canceled');
		} finally {
			delete this.oldPromise;
			this.users = database.objects('users').filtered('username CONTAINS[c] $0', keyword).slice();
			this._getFixedMentions(keyword);
			this.setState({ mentions: this.users });
		}
	}

	async _getRooms(keyword = '') {
		this.roomsCache = this.roomsCache || [];
		this.rooms = database.objects('subscriptions')
			.filtered('t != $0', 'd');
		if (keyword) {
			this.rooms = this.rooms.filtered('name CONTAINS[c] $0', keyword);
		}

		const rooms = [];
		this.rooms.forEach(room => rooms.push(room));

		this.roomsCache.forEach((room) => {
			if (room.name && room.name.toUpperCase().indexOf(keyword.toUpperCase()) !== -1) {
				rooms.push(room);
			}
		});

		if (rooms.length > 3) {
			this.setState({ mentions: rooms });
			return;
		}

		if (this.oldPromise) {
			this.oldPromise();
		}

		try {
			const results = await Promise.race([
				RocketChat.spotlight(keyword, [...rooms, ...this.roomsCache].map(r => r.name), { rooms: true }),
				new Promise((resolve, reject) => (this.oldPromise = reject))
			]);
			if (results.rooms && results.rooms.length) {
				this.roomsCache = [...this.roomsCache, ...results.rooms].filter(onlyUnique);
			}
			this.setState({ mentions: [...rooms.slice(), ...results.rooms] });
		} catch (e) {
			console.warn('spotlight canceled');
		} finally {
			delete this.oldPromise;
		}
	}

	_getEmojis(keyword) {
		if (keyword) {
			this.customEmojis = database.objects('customEmojis').filtered('name CONTAINS[c] $0', keyword).slice(0, 4);
			this.emojis = emojis.filter(emoji => emoji.indexOf(keyword) !== -1).slice(0, 4);
			const mergedEmojis = [...this.customEmojis, ...this.emojis];
			this.setState({ mentions: mergedEmojis });
		}
	}

	stopTrackingMention() {
		this.setState({
			mentions: [],
			trackingType: ''
		});
		this.users = [];
		this.rooms = [];
		this.customEmojis = [];
		this.emojis = [];
	}

	identifyMentionKeyword(keyword, type) {
		this.setState({
			showEmojiKeyboard: false,
			trackingType: type
		});
		this.updateMentions(keyword, type);
	}

	updateMentions = (keyword, type) => {
		if (type === MENTIONS_TRACKING_TYPE_USERS) {
			this._getUsers(keyword);
		} else if (type === MENTIONS_TRACKING_TYPE_EMOJIS) {
			this._getEmojis(keyword);
		} else {
			this._getRooms(keyword);
		}
	}

	_onPressMention(item) {
		const msg = this.component._lastNativeText;

		const { start, end } = this.component._lastNativeSelection;

		const cursor = Math.max(start, end);

		const regexp = /([a-z0-9._-]+)$/im;

		const result = msg.substr(0, cursor).replace(regexp, '');
		const mentionName = this.state.trackingType === MENTIONS_TRACKING_TYPE_EMOJIS ?
			`${ item.name || item }:` : (item.username || item.name);
		const text = `${ result }${ mentionName } ${ msg.slice(cursor) }`;
		this.component.setNativeProps({ text });
		this.setState({ text });
		this.component.focus();
		requestAnimationFrame(() => this.stopTrackingMention());
	}
	_onEmojiSelected(keyboardId, params) {
		const { text } = this.state;
		const { emoji } = params;
		let newText = '';

		// if messagebox has an active cursor
		if (this.component._lastNativeSelection) {
			const { start, end } = this.component._lastNativeSelection;
			const cursor = Math.max(start, end);
			newText = `${ text.substr(0, cursor) }${ emoji }${ text.substr(cursor) }`;
		} else {
			// if messagebox doesn't have a cursor, just append selected emoji
			newText = `${ text }${ emoji }`;
		}
		this.component.setNativeProps({ text: newText });
		this.setState({ text: newText });
	}
	renderFixedMentionItem = item => (
		<TouchableOpacity
			style={styles.mentionItem}
			onPress={() => this._onPressMention(item)}
		>
			<Text style={styles.fixedMentionAvatar}>{item.username}</Text>
			<Text>{item.username === 'here' ? I18n.t('Notify_active_in_this_room') : I18n.t('Notify_all_in_this_room')}</Text>
		</TouchableOpacity>
	)
	renderMentionEmoji = (item) => {
		if (item.name) {
			return (
				<CustomEmoji
					key='mention-item-avatar'
					style={styles.mentionItemCustomEmoji}
					emoji={item}
					baseUrl={this.props.baseUrl}
				/>
			);
		}
		return (
			<Text
				key='mention-item-avatar'
				style={styles.mentionItemEmoji}
			>
				{emojify(`:${ item }:`, { output: 'unicode' })}
			</Text>
		);
	}
	renderMentionItem = (item) => {
		if (item.username === 'all' || item.username === 'here') {
			return this.renderFixedMentionItem(item);
		}
		return (
			<TouchableOpacity
				style={styles.mentionItem}
				onPress={() => this._onPressMention(item)}
				testID={`mention-item-${ this.state.trackingType === MENTIONS_TRACKING_TYPE_EMOJIS ? item.name || item : item.username || item.name }`}
			>
				{this.state.trackingType === MENTIONS_TRACKING_TYPE_EMOJIS ?
					[
						this.renderMentionEmoji(item),
						<Text key='mention-item-name'>:{ item.name || item }:</Text>
					]
					: [
						<Avatar
							key='mention-item-avatar'
							style={{ margin: 8 }}
							text={item.username || item.name}
							size={30}
							type={item.username ? 'd' : 'c'}
							baseUrl={this.props.baseUrl}
						/>,
						<Text key='mention-item-name'>{ item.username || item.name }</Text>
					]
				}
			</TouchableOpacity>
		);
	}
	renderMentions = () => {
		const { mentions, trackingType } = this.state;
		if (!trackingType) {
			return null;
		}
		return (
			<View key='messagebox-container' testID='messagebox-container'>
				<FlatList
					style={styles.mentionList}
					data={mentions}
					renderItem={({ item }) => this.renderMentionItem(item)}
					keyExtractor={item => item._id || item.username || item}
					keyboardShouldPersistTaps='always'
				/>
			</View>
		);
	};

	renderReplyPreview = () => {
		const {
			replyMessage, replying, closeReply, username
		} = this.props;
		if (!replying) {
			return null;
		}
		return <ReplyPreview key='reply-preview' message={replyMessage} close={closeReply} username={username} />;
	};

	renderFilesActions = () => {
		if (!this.state.showFilesAction) {
			return null;
		}
		return (
			<FilesActions
				key='files-actions'
				hideActions={this.toggleFilesActions}
				takePhoto={this.takePhoto}
				chooseFromLibrary={this.chooseFromLibrary}
			/>
		);
	}

	renderContent() {
		if (this.state.recording) {
			return (<Recording onFinish={this.finishAudioMessage} />);
		}
		return (
			[
				this.renderMentions(),
				<View style={styles.composer} key='messagebox'>
					{this.renderReplyPreview()}
					<View
						style={[styles.textArea, this.props.editing && styles.editing]}
						testID='messagebox'
					>
						{this.leftButtons}
						<TextInput
							ref={component => this.component = component}
							style={styles.textBoxInput}
							returnKeyType='default'
							keyboardType='twitter'
							blurOnSubmit={false}
							placeholder={I18n.t('New_Message')}
							onChangeText={text => this.onChangeText(text)}
							value={this.state.text}
							underlineColorAndroid='transparent'
							defaultValue=''
							multiline
							placeholderTextColor='#9EA2A8'
							testID='messagebox-input'
						/>
						{this.rightButtons}
					</View>
				</View>
			]
		);
	}

	render() {
		return (
			[
				<KeyboardAccessoryView
					key='input'
					renderContent={() => this.renderContent()}
					kbInputRef={this.component}
					kbComponent={this.state.showEmojiKeyboard ? 'EmojiKeyboard' : null}
					onKeyboardResigned={() => this.onKeyboardResigned()}
					onItemSelected={this._onEmojiSelected}
					trackInteractive
					// revealKeyboardInteractive
					requiresSameParentToManageScrollView
					addBottomView
				/>,
				this.renderFilesActions(),
				<UploadModal
					key='upload-modal'
					isVisible={(this.state.file && this.state.file.isVisible)}
					file={this.state.file}
					close={() => this.setState({ file: {} })}
					submit={this.sendImageMessage}
				/>
			]
		);
	}
}
