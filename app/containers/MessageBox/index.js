import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, SafeAreaView, FlatList, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-picker';
import { connect } from 'react-redux';
import { emojify } from 'react-emojione';
import { KeyboardAccessoryView } from 'react-native-keyboard-input';
import { userTyping, layoutAnimation } from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import { editRequest, editCancel, clearInput } from '../../actions/messages';
import styles from './styles';
import MyIcon from '../icons';
import database from '../../lib/realm';
import Avatar from '../Avatar';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { emojis } from '../../emojis';
import './EmojiKeyboard';

const MENTIONS_TRACKING_TYPE_USERS = '@';
const MENTIONS_TRACKING_TYPE_EMOJIS = ':';

const onlyUnique = function onlyUnique(value, index, self) {
	return self.indexOf(({ _id }) => value._id === _id) === index;
};

@connect(state => ({
	room: state.room,
	message: state.messages.message,
	editing: state.messages.editing,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}), dispatch => ({
	editCancel: () => dispatch(editCancel()),
	editRequest: message => dispatch(editRequest(message)),
	typing: status => dispatch(userTyping(status)),
	clearInput: () => dispatch(clearInput()),
	layoutAnimation: () => dispatch(layoutAnimation())
}))
export default class MessageBox extends React.PureComponent {
	static propTypes = {
		onSubmit: PropTypes.func.isRequired,
		rid: PropTypes.string.isRequired,
		editCancel: PropTypes.func.isRequired,
		editRequest: PropTypes.func.isRequired,
		baseUrl: PropTypes.string.isRequired,
		message: PropTypes.object,
		editing: PropTypes.bool,
		typing: PropTypes.func,
		clearInput: PropTypes.func,
		layoutAnimation: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			text: '',
			mentions: [],
			showMentionsContainer: false,
			showEmojiKeyboard: false,
			trackingType: ''
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
		} else if (!nextProps.message) {
			this.setState({ text: '' });
		}
	}

	onChangeText(text) {
		this.setState({ text });

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
				accessibilityLabel='Cancel editing'
				accessibilityTraits='button'
				onPress={() => this.editCancel()}
			/>);
		}
		return !this.state.showEmojiKeyboard ? (<Icon
			style={styles.actionButtons}
			onPress={() => this.openEmoji()}
			accessibilityLabel='Open emoji selector'
			accessibilityTraits='button'
			name='mood'
		/>) : (<Icon
			onPress={() => this.closeEmoji()}
			style={styles.actionButtons}
			accessibilityLabel='Close emoji selector'
			accessibilityTraits='button'
			name='keyboard'
		/>);
	}
	get rightButtons() {
		const icons = [];

		if (this.state.text) {
			icons.push(<MyIcon
				style={[styles.actionButtons, { color: '#1D74F5' }]}
				name='send'
				key='sendIcon'
				accessibilityLabel='Send message'
				accessibilityTraits='button'
				onPress={() => this.submit(this.state.text)}
			/>);
		} else {
			icons.push(<MyIcon
				style={[styles.actionButtons, { color: '#2F343D', fontSize: 16 }]}
				name='plus'
				key='fileIcon'
				accessibilityLabel='Message actions'
				accessibilityTraits='button'
				onPress={() => this.addFile()}
			/>);
		}
		return icons;
	}

	addFile = () => {
		const options = {
			maxHeight: 1960,
			maxWidth: 1960,
			quality: 0.8,
			customButtons: [{
				name: 'import', title: 'Import File From'
			}]
		};
		ImagePicker.showImagePicker(options, (response) => {
			if (response.didCancel) {
				console.log('User cancelled image picker');
			} else if (response.error) {
				console.log('ImagePicker Error: ', response.error);
			} else if (response.customButton) {
				console.log('User tapped custom button: ', response.customButton);
			} else {
				const fileInfo = {
					name: response.fileName,
					size: response.fileSize,
					type: response.type || 'image/jpeg',
					// description: '',
					store: 'Uploads'
				};
				RocketChat.sendFileMessage(this.props.rid, fileInfo, response.data);
			}
		});
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
	closeEmoji() {
		this.setState({ showEmojiKeyboard: false });
	}
	submit(message) {
		this.setState({ text: '' });
		this.closeEmoji();
		this.stopTrackingMention();
		this.props.typing(false);
		if (message.trim() === '') {
			return;
		}
		// if is editing a message
		const { editing } = this.props;
		if (editing) {
			const { _id, rid } = this.props.message;
			this.props.editRequest({ _id, msg: message, rid });
		} else {
			// if is submiting a new message
			this.props.onSubmit(message);
		}
		this.props.clearInput();
	}

	_getFixedMentions(keyword) {
		if ('all'.indexOf(keyword) !== -1) {
			this.users = [{ _id: -1, username: 'all', desc: 'all' }, ...this.users];
		}
		if ('here'.indexOf(keyword) !== -1) {
			this.users = [{ _id: -2, username: 'here', desc: 'active users' }, ...this.users];
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
			database.write(() => {
				results.users.forEach((user) => {
					database.create('users', user, true);
				});
			});
		} catch (e) {
			console.log('spotlight canceled');
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
			this.roomsCache = [...this.roomsCache, ...results.rooms].filter(onlyUnique);
			this.setState({ mentions: [...rooms.slice(), ...results.rooms] });
		} catch (e) {
			console.log('spotlight canceled');
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
			showMentionsContainer: false,
			mentions: [],
			trackingType: ''
		});
		this.users = [];
		this.rooms = [];
		this.customEmojis = [];
		this.emojis = [];
	}

	identifyMentionKeyword(keyword, type) {
		if (!this.state.showMentionsContainer) {
			this.props.layoutAnimation();
		}
		this.setState({
			showMentionsContainer: true,
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
			<Text>Notify {item.desc} in this room</Text>
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
							baseUrl={this.props.baseUrl}
						/>,
						<Text key='mention-item-name'>{ item.username || item.name }</Text>
					]
				}
			</TouchableOpacity>
		);
	}
	renderMentions = () => (
		<FlatList
			key='messagebox-container'
			style={styles.mentionList}
			data={this.state.mentions}
			renderItem={({ item }) => this.renderMentionItem(item)}
			keyExtractor={item => item._id || item}
			keyboardShouldPersistTaps='always'
		/>
	);

	renderContent() {
		return (
			[
				this.renderMentions(),
				<SafeAreaView
					key='messagebox'
					style={[styles.textBox, (this.props.editing ? styles.editing : null)]}
				>
					<View style={styles.textArea}>
						{this.leftButtons}
						<TextInput
							ref={component => this.component = component}
							style={styles.textBoxInput}
							returnKeyType='default'
							blurOnSubmit={false}
							placeholder='New Message'
							onChangeText={text => this.onChangeText(text)}
							value={this.state.text}
							underlineColorAndroid='transparent'
							defaultValue=''
							multiline
							placeholderTextColor='#9EA2A8'
						/>
						{this.rightButtons}
					</View>
				</SafeAreaView>
			]
		);
	}

	render() {
		return (
			<KeyboardAccessoryView
				renderContent={() => this.renderContent()}
				kbInputRef={this.component}
				kbComponent={this.state.showEmojiKeyboard ? 'EmojiKeyboard' : null}
				onKeyboardResigned={() => this.onKeyboardResigned()}
				onItemSelected={this._onEmojiSelected}
				trackInteractive
				// revealKeyboardInteractive
				requiresSameParentToManageScrollView
			/>
		);
	}
}
