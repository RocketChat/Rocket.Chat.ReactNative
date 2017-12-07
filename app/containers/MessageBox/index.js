import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, SafeAreaView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-picker';
import { connect } from 'react-redux';
import { userTyping } from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import { editRequest, editCancel, clearInput } from '../../actions/messages';
import styles from './style';
import MyIcon from '../icons';
@connect(state => ({
	room: state.room,
	message: state.messages.message,
	editing: state.messages.editing
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
		message: PropTypes.object,
		editing: PropTypes.bool,
		typing: PropTypes.func,
		clearInput: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			height: 20,
			text: ''
		};
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
	}
	get leftButtons() {
		const { editing } = this.props;
		if (editing) {
			return <Icon style={styles.actionButtons} name='ios-close' onPress={() => this.editCancel()} />;
		}
		return !this.state.emoji ? <Icon style={styles.actionButtons} onPress={() => this.openEmoji()} name='md-happy' /> : <Icon onPress={() => this.openEmoji()} style={styles.actionButtons} name='md-sad' />;
	}
	get rightButtons() {
		const icons = [];

		if (this.state.text.length) {
			icons.push(<MyIcon
				style={[styles.actionButtons, { color: '#1D74F5' }]}
				name='send'
				key='sendIcon'
				onPress={() => this.submit(this.component._lastNativeText)}
			/>);
		}
		icons.push(<MyIcon
			style={[styles.actionButtons, { color: '#2F343D', fontSize: 16 }]}
			name='plus'
			key='fileIcon'
			onPress={() => this.addFile()}
		/>);
		return icons;
	}

	// get placeholder() {
	// 	return `New Message`.substring(0, 35);
	// }
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
		this.props.clearInput();
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
		});
	}

	render() {
		const { height } = this.state;
		return (
			<SafeAreaView style={[styles.textBox, (this.props.editing ? styles.editing : null)]}>
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
		);
	}
}
