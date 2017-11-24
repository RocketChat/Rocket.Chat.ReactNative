import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, StyleSheet, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-picker';
import { connect } from 'react-redux';
import { userTyping } from '../actions/room';
import RocketChat from '../lib/rocketchat';
import { editRequest, editCancel, clearInput } from '../actions/messages';

const styles = StyleSheet.create({
	textBox: {
		paddingTop: 1,
		paddingHorizontal: 15,
		borderTopWidth: 1,
		borderTopColor: '#ccc',
		backgroundColor: '#fff'
	},
	safeAreaView: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	textBoxInput: {
		height: 40,
		alignSelf: 'stretch',
		flexGrow: 1
	},
	actionButtons: {
		color: '#aaa',
		paddingTop: 10,
		paddingBottom: 10,
		fontSize: 20
	},
	editing: {
		backgroundColor: '#fff5df'
	}
});

@connect(state => ({
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

	editCancel() {
		this.props.editCancel();
		this.component.setNativeProps({ text: '' });
	}

	renderLeftButton() {
		const { editing } = this.props;
		if (editing) {
			return <Icon style={styles.actionButtons} name='close' onPress={() => this.editCancel()} />;
		}
		return <Icon style={styles.actionButtons} name='add-circle-outline' onPress={this.addFile} />;
	}

	render() {
		return (
			<View style={[styles.textBox, (this.props.editing ? styles.editing : null)]}>
				<SafeAreaView style={styles.safeAreaView}>
					{this.renderLeftButton()}
					<TextInput
						ref={component => this.component = component}
						style={styles.textBoxInput}
						returnKeyType='send'
						onSubmitEditing={event => this.submit(event.nativeEvent.text)}
						blurOnSubmit={false}
						placeholder='New message'
						onChangeText={text => this.props.typing(text.length > 0)}
						underlineColorAndroid='transparent'
						defaultValue=''
					/>
				</SafeAreaView>
			</View>
		);
	}
}
