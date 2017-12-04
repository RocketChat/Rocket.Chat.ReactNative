import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TextInput, SafeAreaView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-picker';
import { connect } from 'react-redux';
import * as Animatable from 'react-native-animatable';
import { userTyping } from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import { editRequest, editCancel, clearInput } from '../../actions/messages';
import Actions from './Actions';
import styles from './style';

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
			height: 40,
			text: '',
			open: false
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

	submit(message) {
		this.component.setNativeProps({ text: '' });
		this.props.typing(false);
		this.setState({ text: '' });
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

	updateSize = (height) => {
		this.setState({ height: height + (Platform.OS === 'ios' ? 20 : 0) });
	}

	editCancel() {
		this.props.editCancel();
		this.component.setNativeProps({ text: '' });
	}
	openEmoji() {
		this.setState({ emoji: !this.state.emoji });
	}
	get leftButtons() {
		const { editing } = this.props;
		if (editing) {
			return <Icon style={styles.actionButtons} name='ios-close' onPress={() => this.editCancel()} />;
		}
		return !this.state.emoji ? <Icon style={styles.actionButtons} onPress={() => this.openEmoji()} name='md-happy' /> : <Icon onPress={() => this.openEmoji()} style={styles.actionButtons} name='md-sad' />;
	}
	get rightButtons() {
		if (this.state.text.length) {
			return (<Icon
				style={[styles.actionButtons]}
				name='md-send'
				onPress={() => this.submit(this.component._lastNativeText)}
			/>);
		}
		return (<Animatable.View style={{ flexGrow: 0 }} useNativeDriver ref={component => this.moreActionsIcon = component}><Icon
			style={[styles.actionButtons, { color: this.state.open ? '#1D74F5' : '#2F343D' }]}
			name='ios-add'
			onPress={() => this.moreActionsClick()}
		/>
          </Animatable.View>);
	}
	get placeholder() {
		return `Message to ${ this.props.room.rid }`.substring(0, 35);
	}
	onChange(text) {
		this.setState({ text });
		this.props.typing(text.length > 0);
	}
	moreActionsClick() {
		const [close, open] = [{ rotate: '135deg' }, { rotate: '0deg' }];
		this.moreActionsIcon.transition(this.state.open ? close : open, !this.state.open ? close : open, 300, 'ease-out');
		this.setState({ open: !this.state.open });
	}
	onAction() {
		this.setState({ open: false });
	}
	render() {
		const { height } = this.state;
		return (
			<SafeAreaView style={[styles.textBox, (this.props.editing ? styles.editing : null)]}>
				<Actions open={this.state.open} onAction={() => this.onAction()} />
				<View style={styles.textArea}>
					{this.leftButtons}
					<TextInput
						ref={component => this.component = component}
						style={[styles.textBoxInput, { height }]}
						returnKeyType='default'
						blurOnSubmit={false}
						placeholder={this.placeholder}
						onChangeText={text => this.onChange(text)}
						underlineColorAndroid='transparent'
						defaultValue=''
						multiline
						placeholderTextColor='#9EA2A8'
						onContentSizeChange={e => this.updateSize(e.nativeEvent.contentSize.height)}
						onFocus={() => this.setState({ open: false })}
					/>
					{this.rightButtons}
				</View>
			</SafeAreaView>
		);
	}
}
