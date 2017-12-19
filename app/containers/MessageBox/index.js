import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, SafeAreaView, Platform, FlatList, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-picker';
import { connect } from 'react-redux';
import { userTyping } from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import { editRequest, editCancel, clearInput } from '../../actions/messages';
import styles from './style';
import MyIcon from '../icons';
import realm from '../../lib/realm';
import Avatar from '../Avatar';
import AnimatedContainer from './AnimatedContainer';

const MENTIONS_TRACKING_TYPE_USERS = '@';
const MENTIONS_TRACKING_TYPE_ROOMS = '#';

@connect(state => ({
	room: state.room,
	message: state.messages.message,
	editing: state.messages.editing,
	baseUrl: state.settings.Site_Url
}), dispatch => ({
	editCancel: () => dispatch(editCancel()),
	editRequest: message => dispatch(editRequest(message)),
	typing: status => dispatch(userTyping(status)),
	clearInput: () => dispatch(clearInput())
}))
export default class MessageBox extends React.Component {
	static propTypes = {
		onSubmit: PropTypes.func.isRequired,
		rid: PropTypes.string.isRequired,
		editCancel: PropTypes.func.isRequired,
		editRequest: PropTypes.func.isRequired,
		baseUrl: PropTypes.string.isRequired,
		message: PropTypes.object,
		editing: PropTypes.bool,
		typing: PropTypes.func,
		clearInput: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			height: 20,
			messageboxHeight: 0,
			text: '',
			isTrackingMentions: false,
			mentionsTrackingType: '',
			mentionKeyword: '',
			mentions: [],
			showAnimatedContainer: false,
			previousChar: ' '
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
		}
	}

	onChangeText(text) {
		this.setState({ text });
		this.props.typing(text.length > 0);

		// get last char
		const lastChar = text.substr(text.length - 1);
		// identify if is a new word
		const newWord = this.state.previousChar.trim().length === 0;
		// if is a new word and is an identified tracking type, e.g. @ or #, start tracking
		if ((lastChar === MENTIONS_TRACKING_TYPE_USERS || lastChar === MENTIONS_TRACKING_TYPE_ROOMS) && newWord) {
			this.startTrackingMention(lastChar);
		// if word ended and is still tracking mentions, stop tracking
		} else if ((lastChar === ' ' && this.state.isTrackingMentions) || text === '') {
			this.stopTrackingMention();
		// if is tracking, identify keyword typed, e.g. transforms `@foo` on `foo`
		} else if (this.state.isTrackingMentions) {
			this.identifyMentionKeyword(text);
		}
		this.setState({ previousChar: lastChar });
	}

	get leftButtons() {
		const { editing } = this.props;
		if (editing) {
			return (<Icon
				style={styles.actionButtons}
				name='ios-close'
				accessibilityLabel='Cancel editing'
				accessibilityTraits='button'
				onPress={() => this.editCancel()}
			/>);
		}
		return !this.state.emoji ? (<Icon
			style={styles.actionButtons}
			onPress={() => this.openEmoji()}
			accessibilityLabel='Open emoji selector'
			accessibilityTraits='button'
			name='md-happy'
		/>) : (<Icon
			onPress={() => this.openEmoji()}
			style={styles.actionButtons}
			accessibilityLabel='Close emoji selector'
			accessibilityTraits='button'
			name='md-sad'
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
		}
		icons.push(<MyIcon
			style={[styles.actionButtons, { color: '#2F343D', fontSize: 16 }]}
			name='plus'
			key='fileIcon'
			accessibilityLabel='Message actions'
			accessibilityTraits='button'
			onPress={() => this.addFile()}
		/>);
		return icons;
	}

	updateSize = (height) => {
		this.setState({ height: height + (Platform.OS === 'ios' ? 0 : 0) });
	}
	addFile = () => {
		const options = {
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
	openEmoji() {
		this.setState({ emoji: !this.state.emoji });
	}
	submit(message) {
		this.setState({ text: '' });
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

	_getUsers(keyword) {
		this.users = realm.objects('users');
		if (keyword) {
			this.users = this.users.filtered('username CONTAINS[c] $0', keyword);
		}
		this.setState({ mentions: this.users.slice() });

		const usernames = [];
		this.users.forEach(user => usernames.push(user.username));

		if (keyword && usernames.length < 7) {
			if (this.oldPromise) {
				this.oldPromise();
			}
			Promise.race([
				RocketChat.spotlight(keyword, usernames),
				new Promise((resolve, reject) => (this.oldPromise = reject))
			]).then(
				(results) => {
					realm.write(() => {
						results.users.forEach((user) => {
							user._server = {
								id: this.props.baseUrl,
								current: true
							};
							realm.create('users', user, true);
						});
					});
				},
				() => {}
			).then(() => {
				delete this.oldPromise;
				this.users = realm.objects('users').filtered('username CONTAINS[c] $0', keyword);
				this.setState({ mentions: this.users.slice() });
			});
		}
	}

	_getRooms(keyword) {
		this.rooms = realm.objects('subscriptions')
			.filtered('_server.id = $0 AND t != $1', this.props.baseUrl, 'd');
		if (keyword) {
			this.rooms = this.rooms.filtered('name CONTAINS[c] $0', keyword);
		}
		this.setState({ mentions: this.rooms.slice() });

		const rooms = [];
		this.rooms.forEach(room => rooms.push(room.name));

		if (keyword && rooms.length < 7) {
			if (this.oldPromise) {
				this.oldPromise();
			}
			Promise.race([
				RocketChat.spotlight(keyword, rooms),
				new Promise((resolve, reject) => (this.oldPromise = reject))
			]).then(
				(results) => {
					realm.write(() => {
						results.rooms.forEach((sub) => {
							sub.rid = sub._id;
							sub._server = {
								id: this.props.baseUrl,
								current: true
							};
							realm.create('subscriptions', sub, true);
						});
					});
				},
				() => {}
			).then(() => {
				delete this.oldPromise;
				this.rooms = realm.objects('subscriptions')
					.filtered('_server.id = $0 AND t != $1', this.props.baseUrl, 'd')
					.filtered('name CONTAINS[c] $0', keyword);
				this.setState({ mentions: this.rooms.slice() });
			});
		}
	}

	startTrackingMention(char) {
		if (char === MENTIONS_TRACKING_TYPE_USERS) {
			this._getUsers();
		} else {
			this._getRooms();
		}
		this.setState({
			showAnimatedContainer: true,
			isTrackingMentions: true,
			mentionsTrackingType: char
		});
	}

	stopTrackingMention() {
		this.setState({
			showAnimatedContainer: false
		});
		setTimeout(() => {
			this.setState({
				isTrackingMentions: false,
				mentionsTrackingType: '',
				mentionKeyword: '',
				mentions: [],
				previousChar: ' '
			});
			this.users = [];
			this.rooms = [];
		}, 300);
	}

	identifyMentionKeyword(val) {
		let pattern;
		if (this.state.mentionsTrackingType === MENTIONS_TRACKING_TYPE_USERS) {
			pattern = new RegExp(/@[0-9a-zA-Z-_.]+/);
		} else {
			pattern = new RegExp(/#[0-9a-zA-Z-_.]+/);
		}
		const keywordArray = val.match(pattern);
		if (keywordArray && !!keywordArray.length) {
			const keyword = keywordArray[0].substring(1) || '';
			this.setState({ mentionKeyword: keyword });
			this.updateMentions(keyword);
		}
	}

	updateMentions = (keyword) => {
		if (this.state.mentionsTrackingType === MENTIONS_TRACKING_TYPE_USERS) {
			this._getUsers(keyword);
		} else {
			this._getRooms(keyword);
		}
	}

	_onPressMention(item) {
		const { text } = this.state;
		const message = text.slice(0, -this.state.mentionKeyword.length || text.length);
		this.setState({ text: `${ message }${ item.username || item.name } ` });
		this.component.focus();
		this.stopTrackingMention();
	}

	renderMentionItem = item => (
		<TouchableOpacity
			style={styles.mentionItem}
			onPress={() => this._onPressMention(item)}
		>
			<Avatar
				style={{ margin: 8 }}
				text={item.username || item.name}
				size={24}
				baseUrl={this.props.baseUrl}
			/>
			<Text>{item.username || item.name}</Text>
		</TouchableOpacity>
	)

	renderMentions() {
		const usersList = (
			<FlatList
				style={styles.mentionList}
				data={this.state.mentions}
				renderItem={({ item }) => this.renderMentionItem(item)}
				keyExtractor={item => item._id}
				keyboardShouldPersistTaps='always'
				keyboardDismissMode='interactive'
			/>
		);
		const { showAnimatedContainer, messageboxHeight } = this.state;
		return <AnimatedContainer visible={showAnimatedContainer} subview={usersList} messageboxHeight={messageboxHeight} />;
	}

	render() {
		const { height } = this.state;
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
							style={[styles.textBoxInput, { height }]}
							returnKeyType='default'
							blurOnSubmit={false}
							placeholder='New Message'
							onChangeText={text => this.onChangeText(text)}
							value={this.state.text}
							underlineColorAndroid='transparent'
							defaultValue=''
							multiline
							placeholderTextColor='#9EA2A8'
							onContentSizeChange={e => this.updateSize(e.nativeEvent.contentSize.height)}
						/>
						{this.rightButtons}
					</View>
				</SafeAreaView>
				{this.renderMentions()}
			</View>
		);
	}
}
