import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, SafeAreaView, FlatList, Text, TouchableOpacity, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-picker';
import { connect } from 'react-redux';
import { userTyping } from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import { editRequest, editCancel, clearInput } from '../../actions/messages';
import styles from './style';
import MyIcon from '../icons';
import database from '../../lib/realm';
import Avatar from '../Avatar';
import AnimatedContainer from './AnimatedContainer';
import EmojiPicker from './EmojiPicker';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

const MENTIONS_TRACKING_TYPE_USERS = '@';

const onlyUnique = function onlyUnique(value, index, self) {
	return self.indexOf(({ _id }) => value._id === _id) === index;
};

@connect(state => ({
	room: state.room,
	message: state.messages.message,
	editing: state.messages.editing,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	isKeyboardOpen: state.keyboard.isOpen
}), dispatch => ({
	editCancel: () => dispatch(editCancel()),
	editRequest: message => dispatch(editRequest(message)),
	typing: status => dispatch(userTyping(status)),
	clearInput: () => dispatch(clearInput())
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
		isKeyboardOpen: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.state = {
			messageboxHeight: 0,
			text: '',
			mentions: [],
			showMentionsContainer: false,
			showEmojiContainer: false
		};
		this.users = [];
		this.rooms = [];
	}
	componentWillReceiveProps(nextProps) {
		if (this.props.message !== nextProps.message && nextProps.message.msg) {
			this.setState({ text: nextProps.message.msg });
			this.component.focus();
		} else if (!nextProps.message) {
			this.setState({ text: '' });
		} else if (this.props.isKeyboardOpen !== nextProps.isKeyboardOpen && nextProps.isKeyboardOpen) {
			this.closeEmoji();
		}
	}

	onChangeText(text) {
		this.setState({ text });

		requestAnimationFrame(() => {
			const { start, end } = this.component._lastNativeSelection;

			const cursor = Math.max(start, end);

			const lastNativeText = this.component._lastNativeText;

			const regexp = /(#|@)([a-z._-]+)$/im;

			const result = lastNativeText.substr(0, cursor).match(regexp);

			if (!result) {
				return this.stopTrackingMention();
			}
			const [, lastChar, name] = result;

			this.identifyMentionKeyword(name, lastChar);
		});
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
		return !this.state.showEmojiContainer ? (<Icon
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
		await this.setState({ showEmojiContainer: !this.state.showEmojiContainer });
		Keyboard.dismiss();
	}
	closeEmoji() {
		this.setState({ showEmojiContainer: false });
	}
	submit(message) {
		this.setState({ text: '' });
		this.closeEmoji();
		this.stopTrackingMention();
		requestAnimationFrame(() => {
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
		});
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

	stopTrackingMention() {
		this.setState({
			showMentionsContainer: false,
			mentions: []
		});
		this.users = [];
		this.rooms = [];
	}

	identifyMentionKeyword(keyword, type) {
		this.updateMentions(keyword, type);
		this.setState({
			showMentionsContainer: true
		});
	}

	updateMentions = (keyword, type) => {
		if (type === MENTIONS_TRACKING_TYPE_USERS) {
			this._getUsers(keyword);
		} else {
			this._getRooms(keyword);
		}
	}

	_onPressMention(item) {
		const msg = this.component._lastNativeText;

		const { start, end } = this.component._lastNativeSelection;

		const cursor = Math.max(start, end);

		const regexp = /([a-z._-]+)$/im;

		const result = msg.substr(0, cursor).replace(regexp, '');
		const text = `${ result }${ item.username || item.name } ${ msg.slice(cursor) }`;
		this.component.setNativeProps({ text });
		this.setState({ text });
		this.component.focus();
		requestAnimationFrame(() => this.stopTrackingMention());
	}
	_onEmojiSelected(emoji) {
		const { text } = this.state;
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
	renderMentionItem = (item) => {
		if (item.username === 'all' || item.username === 'here') {
			return this.renderFixedMentionItem(item);
		}
		return (
			<TouchableOpacity
				style={styles.mentionItem}
				onPress={() => this._onPressMention(item)}
			>
				<Avatar
					style={{ margin: 8 }}
					text={item.username || item.name}
					size={30}
					baseUrl={this.props.baseUrl}
				/>
				<Text>{item.username || item.name }</Text>
			</TouchableOpacity>
		);
	}
	renderEmoji() {
		const emojiContainer = (
			<View style={styles.emojiContainer}>
				<EmojiPicker onEmojiSelected={emoji => this._onEmojiSelected(emoji)} />
			</View>
		);
		const { showEmojiContainer, messageboxHeight } = this.state;
		return <AnimatedContainer visible={showEmojiContainer} subview={emojiContainer} messageboxHeight={messageboxHeight} />;
	}
	renderMentions() {
		const usersList = (
			<FlatList
				style={styles.mentionList}
				data={this.state.mentions}
				renderItem={({ item }) => this.renderMentionItem(item)}
				keyExtractor={item => item._id}
				{...scrollPersistTaps}
			/>
		);
		const { showMentionsContainer, messageboxHeight } = this.state;
		return <AnimatedContainer visible={showMentionsContainer} subview={usersList} messageboxHeight={messageboxHeight} />;
	}
	render() {
		return (
			<View>
				<SafeAreaView
					style={[styles.textBox, (this.props.editing ? styles.editing : null)]}
					onLayout={event => this.setState({ messageboxHeight: event.nativeEvent.layout.height })}
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
				{this.renderMentions()}
				{this.renderEmoji()}
			</View>
		);
	}
}
