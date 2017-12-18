import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, SafeAreaView, Platform, FlatList, Text, Animated, TouchableOpacity } from 'react-native';
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

const MENTION_HEIGHT = 40;

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
		this.users = realm
			.objects('users'); // .filtered('_server.id = $0', 'https://open.rocket.chat');
		this.state = {
			height: 20,
			text: '',
			isTrackingStarted: false,
			usersFilter: this.users,
			mentionKeyword: ''
		};
		this.animatedBottom = new Animated.Value(0);
		this.previousChar = ' ';
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.message !== nextProps.message && nextProps.message) {
			this.component.setNativeProps({ text: nextProps.message.msg });
			this.component.focus();
		} else if (!nextProps.message) {
			this.component.setNativeProps({ text: '' });
		}
	}

	onChangeText(text) {
		this.setState({ text });
		this.props.typing(text.length > 0);

		const lastChar = text.substr(text.length - 1);
		const newWord = this.previousChar.trim().length === 0; // TODO: testar se é char via regex
		if (lastChar === '@' && newWord) {
			this.startTracking();
		} else if ((lastChar === ' ' && this.state.isTrackingStarted) || text === '') {
			this.stopTracking();
		}
		this.previousChar = lastChar;
		this.identifyKeyword(text);
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

		if (this.state.text.length) {
			icons.push(<MyIcon
				style={[styles.actionButtons, { color: '#1D74F5' }]}
				name='send'
				key='sendIcon'
				accessibilityLabel='Send message'
				accessibilityTraits='button'
				onPress={() => this.submit(this.component._lastNativeText)}
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

	startTracking() {
		this.setState({
			isTrackingStarted: true
		});
		this.openSuggestionsPanel();
	}

	stopTracking() {
		this.closeSuggestionsPanel();
		setTimeout(() => {
			this.setState({
				isTrackingStarted: false
			});
		}, 300);
	}

	openSuggestionsPanel() {
		this.animatedBottom.setValue(0);
		Animated.timing(this.animatedBottom, {
			toValue: 1,
			duration: 300
		}).start();
	}

	closeSuggestionsPanel() {
		Animated.timing(this.animatedBottom, {
			toValue: 0,
			duration: 300
		}).start();
	}

	identifyKeyword(val) {
		if (this.state.isTrackingStarted) {
			const pattern = new RegExp(/@[0-9a-zA-Z-_.]+/);
			const keywordArray = val.match(pattern);
			if (keywordArray && !!keywordArray.length) {
				const keyword = keywordArray[0].substring(1) || '';
				this.setState({ mentionKeyword: keyword })
				this.updateSuggestions(keyword);
			}
		}
	}

	updateSuggestions = (keyword) => {
		const usersFilter = this.users.filtered('username CONTAINS[c] $0', keyword).slice();
		this.setState({
			usersFilter
		});
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
		this.component.setNativeProps({ text: '' });
	}
	openEmoji() {
		this.setState({ emoji: !this.state.emoji });
	}
	submit(message) {
		this.component.setNativeProps({ text: '' });
		this.setState({ text: '' });
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

	didPressMentionItem(item) {
		const text = this.component._lastNativeText;
		const message = text.slice(0, -this.state.mentionKeyword.length || text.length);
		this.component.setNativeProps({ text: `${ message }${ item.username } ` });
		this.component.focus();
		this.stopTracking();
	}

	renderMentionItem = item => (
		<TouchableOpacity
			style={{
				height: MENTION_HEIGHT,
				backgroundColor: '#F7F8FA',
				borderBottomWidth: 1,
				borderBottomColor: '#ECECEC',
				flexDirection: 'row',
				alignItems: 'center'
			}}
			onPress={() => this.didPressMentionItem(item)}
		>
			<Avatar
				style={{ margin: 8 }}
				text={item.username}
				size={24}
				baseUrl={this.props.baseUrl}
			/>
			<Text>{item.username}</Text>
		</TouchableOpacity>
	)

	renderMentions() {
		const bottom = this.animatedBottom.interpolate({
			inputRange: [0, 1],
			outputRange: [-200, 53]
		});

		if (!this.state.isTrackingStarted || this.state.usersFilter.length === 0) {
			return null;
		}

		return (
			<Animated.View
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom,
					zIndex: 1
				}}
			>
				<FlatList
					style={{
						maxHeight: MENTION_HEIGHT * 4,
						borderTopColor: '#ECECEC',
						borderTopWidth: 1,
						backgroundColor: '#fff'
					}}
					data={this.state.usersFilter}
					renderItem={({ item }) => this.renderMentionItem(item)}
					keyExtractor={item => item._id}
				/>
			</Animated.View>
		);
	}

	render() {
		const { height } = this.state;
		return (
			<View>
				<SafeAreaView style={[styles.textBox, (this.props.editing ? styles.editing : null), { zIndex: 2 }]}>
					<View style={styles.textArea}>
						{this.leftButtons}
						<TextInput
							ref={component => this.component = component}
							style={[styles.textBoxInput, { height }]}
							returnKeyType='default'
							blurOnSubmit={false}
							placeholder='New Message'
							onChangeText={text => this.onChangeText(text)}
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
