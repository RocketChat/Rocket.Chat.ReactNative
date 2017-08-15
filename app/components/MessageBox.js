import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-picker';
import RocketChat from '../lib/rocketchat';

const styles = StyleSheet.create({
	textBox: {
		paddingTop: 1,
		borderTopWidth: 1,
		borderTopColor: '#ccc',
		backgroundColor: '#fff',
		flexDirection: 'row',
		alignItems: 'center'
	},
	textBoxInput: {
		height: 40,
		alignSelf: 'stretch',
		backgroundColor: '#fff',
		flexGrow: 1
	},
	fileButton: {
		color: '#aaa',
		paddingLeft: 23,
		paddingRight: 20,
		paddingTop: 10,
		paddingBottom: 10,
		fontSize: 20
	}
});

export default class MessageBox extends React.PureComponent {
	static propTypes = {
		onSubmit: PropTypes.func.isRequired,
		rid: PropTypes.string.isRequired
	}

	constructor(props) {
		super(props);

		this.state = {
			text: ''
		};
	}

	submit(message) {
		// console.log(this.state);
		const text = message;
		this.setState({ text: '' });
		if (text.trim() === '') {
			return;
		}
		this.props.onSubmit(text);
	}

	addFile = () => {
		const options = {
			customButtons: [{
				name: 'import', title: 'Import File From'
			}]
		};

		ImagePicker.showImagePicker(options, (response) => {
			// console.log('Response = ', response);

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

	render() {
		return (
			<View style={styles.textBox}>
				<Icon style={styles.fileButton} name='add-circle-outline' onPress={this.addFile} />
				<TextInput
					ref={component => this.component = component}
					style={styles.textBoxInput}
					value={this.state.text}
					onChangeText={text => this.setState({ text })}
					returnKeyType='send'
					onSubmitEditing={event => this.submit(event.nativeEvent.text)}
					blurOnSubmit={false}
					placeholder='New message'
					underlineColorAndroid='transparent'
				/>
			</View>
		);
	}
}
