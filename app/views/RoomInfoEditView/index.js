import React from 'react';
import PropTypes from 'prop-types';
import { Text, TextInput, View, ScrollView, TouchableOpacity, SafeAreaView, Keyboard } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert, showToast } from '../../utils/info';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';

export default class RoomInfoEditView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object
	};

	constructor(props) {
		super(props);
		const { rid } = props.navigation.state.params;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.state = {
			room: {},
			name: '',
			description: '',
			topic: '',
			announcement: '',
			nameError: {},
			descriptionError: {},
			topicError: {},
			announcementError: {},
			saving: false
		};
	}

	async componentDidMount() {
		await this.updateRoom();
		const {
			name, description, topic, announcement
		} = this.state.room;
		this.setState({
			name, description, topic, announcement
		});
		this.rooms.addListener(this.updateRoom);
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
	}

	updateRoom = async() => {
		const [room] = this.rooms;
		this.setState({ room });
	}

	clearErrors = () => {
		this.setState({
			nameError: {}, descriptionError: {}, topicError: {}, announcementError: {}
		});
	}

	formIsChanged = () => {
		const {
			room, name, description, topic, announcement
		} = this.state;
		return !(room.name === name && room.description === description && room.topic === topic && room.announcement === announcement);
	}

	submit = async() => {
		Keyboard.dismiss();
		const {
			room, name, description, topic, announcement
		} = this.state;

		this.setState({ saving: true });
		let error = false;

		if (!this.formIsChanged()) {
			showErrorAlert('Nothing to save!');
			return;
		}

		// Clear error objects
		await this.clearErrors();

		// Name
		if (room.name !== name) {
			try {
				await RocketChat.saveRoomSettings(room.rid, 'roomName', name);
			} catch (nameError) {
				this.setState({ nameError });
				error = true;
			}
		}
		// Description
		if (room.description !== description) {
			try {
				await RocketChat.saveRoomSettings(room.rid, 'roomDescription', description);
			} catch (descriptionError) {
				this.setState({ descriptionError });
				error = true;
			}
		}
		// Topic
		if (room.topic !== topic) {
			try {
				await RocketChat.saveRoomSettings(room.rid, 'roomTopic', topic);
			} catch (topicError) {
				this.setState({ topicError });
				error = true;
			}
		}
		// Announcement
		if (room.announcement !== announcement) {
			try {
				await RocketChat.saveRoomSettings(room.rid, 'roomAnnouncement', announcement);
			} catch (announcementError) {
				this.setState({ announcementError });
				error = true;
			}
		}

		await this.setState({ saving: false });
		setTimeout(() => {
			if (error) {
				showErrorAlert('There was an error while saving settings!');
			} else {
				showToast('Settings succesfully changed!');
			}
		}, 100);
	}

	render() {
		const {
			name, nameError, description, descriptionError, topic, topicError, announcement, announcementError
		} = this.state;
		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<ScrollView
					style={sharedStyles.loginView}
					{...scrollPersistTaps}
				>
					<SafeAreaView>
						<View style={sharedStyles.formContainer}>
							<View style={styles.inputContainer}>
								<Text style={[styles.label, nameError.error && styles.labelError]}>Name</Text>
								<TextInput
									ref={(e) => { this.name = e; }}
									style={[styles.input, nameError.error && styles.inputError]}
									onChangeText={value => this.setState({ name: value })}
									value={name}
									autoCorrect={false}
									returnKeyType='next'
									autoCapitalize='none'
									underlineColorAndroid='transparent'
									onSubmitEditing={() => { this.description.focus(); }}
								/>
								{nameError.error && <Text style={sharedStyles.error}>{nameError.reason}</Text>}
							</View>
							<View style={styles.inputContainer}>
								<Text style={[styles.label, descriptionError.error && styles.labelError]}>Description</Text>
								<TextInput
									ref={(e) => { this.description = e; }}
									style={[styles.input, descriptionError.error && styles.inputError]}
									onChangeText={value => this.setState({ description: value })}
									value={description}
									autoCorrect={false}
									returnKeyType='next'
									autoCapitalize='none'
									underlineColorAndroid='transparent'
									onSubmitEditing={() => { this.topic.focus(); }}
									multiline
								/>
							</View>
							<View style={styles.inputContainer}>
								<Text style={[styles.label, topicError.error && styles.labelError]}>Topic</Text>
								<TextInput
									ref={(e) => { this.topic = e; }}
									style={[styles.input, topicError.error && styles.inputError]}
									onChangeText={value => this.setState({ topic: value })}
									value={topic}
									autoCorrect={false}
									returnKeyType='next'
									autoCapitalize='none'
									underlineColorAndroid='transparent'
									onSubmitEditing={() => { this.announcement.focus(); }}
									multiline
								/>
							</View>
							<View style={styles.inputContainer}>
								<Text style={[styles.label, announcementError.error && styles.labelError]}>Announcement</Text>
								<TextInput
									ref={(e) => { this.announcement = e; }}
									style={[styles.input, announcementError.error && styles.inputError]}
									onChangeText={value => this.setState({ announcement: value })}
									value={announcement}
									autoCorrect={false}
									returnKeyType='done'
									autoCapitalize='none'
									underlineColorAndroid='transparent'
									onSubmitEditing={this.submit}
									multiline
								/>
							</View>
							<TouchableOpacity
								style={[sharedStyles.buttonContainer, !this.formIsChanged() && styles.buttonContainerDisabled]}
								onPress={this.submit}
								disabled={!this.formIsChanged()}
							>
								<Text style={sharedStyles.button} accessibilityTraits='button'>SAVE</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[sharedStyles.buttonContainer_inverted, sharedStyles.buttonContainerLastChild]}
								onPress={this.reset}
							>
								<Text style={sharedStyles.button_inverted} accessibilityTraits='button'>RESET</Text>
							</TouchableOpacity>
						</View>
						<Spinner visible={this.state.saving} textContent='Loading...' textStyle={{ color: '#FFF' }} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
