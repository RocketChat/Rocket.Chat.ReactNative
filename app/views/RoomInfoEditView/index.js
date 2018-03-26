import React from 'react';
import PropTypes from 'prop-types';
import { Text, TextInput, View, ScrollView, TouchableOpacity, SafeAreaView, Keyboard, Switch, StyleSheet } from 'react-native';
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
			saving: false,
			t: false,
			ro: false,
			reactWhenReadOnly: false
		};
	}

	async componentDidMount() {
		await this.updateRoom();
		this.init();
		this.rooms.addListener(this.updateRoom);
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
	}

	updateRoom = async() => {
		const [room] = this.rooms;
		this.setState({ room });
	}

	init = () => {
		const {
			name, description, topic, announcement, t, ro, reactWhenReadOnly
		} = this.state.room;
		this.setState({
			name, description, topic, announcement, t: t === 'p', ro, reactWhenReadOnly
		});
	}

	clearErrors = () => {
		this.setState({
			nameError: {}
		});
	}

	reset = () => {
		this.clearErrors();
		this.init();
	}

	formIsChanged = () => {
		const {
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly
		} = this.state;
		return !(room.name === name &&
			room.description === description &&
			room.topic === topic &&
			room.announcement === announcement &&
			room.t === 'p' === t &&
			room.ro === ro &&
			room.reactWhenReadOnly === reactWhenReadOnly
		);
	}

	submit = async() => {
		Keyboard.dismiss();
		const {
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly
		} = this.state;

		this.setState({ saving: true });
		let error = false;

		if (!this.formIsChanged()) {
			showErrorAlert('Nothing to save!');
			return;
		}

		// Clear error objects
		await this.clearErrors();

		const params = {};

		// Name
		if (room.name !== name) {
			params.roomName = name;
		}
		// Description
		if (room.description !== description) {
			params.roomDescription = description;
		}
		// Topic
		if (room.topic !== topic) {
			params.roomTopic = topic;
		}
		// Announcement
		if (room.announcement !== announcement) {
			params.roomAnnouncement = announcement;
		}
		// Room Type
		if (room.t !== t) {
			params.roomType = t ? 'p' : 'c';
		}
		// Read Only
		if (room.ro !== ro) {
			params.readOnly = ro;
		}
		// Read Only
		if (room.reactWhenReadOnly !== reactWhenReadOnly) {
			params.reactWhenReadOnly = reactWhenReadOnly;
		}

		try {
			await RocketChat.saveRoomSettings(room.rid, params);
		} catch (e) {
			if (e.error === 'error-invalid-room-name') {
				this.setState({ nameError: e });
			}
			error = true;
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
			name, nameError, description, topic, announcement, t, ro, reactWhenReadOnly
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
								<Text style={styles.label}>Description</Text>
								<TextInput
									ref={(e) => { this.description = e; }}
									style={styles.input}
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
								<Text style={styles.label}>Topic</Text>
								<TextInput
									ref={(e) => { this.topic = e; }}
									style={styles.input}
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
								<Text style={styles.label}>Announcement</Text>
								<TextInput
									ref={(e) => { this.announcement = e; }}
									style={styles.input}
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
							<View style={styles.switchContainer}>
								<View style={[styles.switchLabelContainer, sharedStyles.alignItemsFlexEnd]}>
									<Text style={styles.switchLabelPrimary}>Public</Text>
									<Text style={[styles.switchLabelSecondary, sharedStyles.textAlignRight]}>Everyone can access this channel</Text>
								</View>
								<Switch
									style={styles.switch}
									onValueChange={value => this.setState({ t: value })}
									value={t}
								/>
								<View style={styles.switchLabelContainer}>
									<Text style={styles.switchLabelPrimary}>Private</Text>
									<Text style={styles.switchLabelSecondary}>Just invited people can access this channel</Text>
								</View>
							</View>
							<View style={styles.divider} />
							<View style={styles.switchContainer}>
								<View style={[styles.switchLabelContainer, sharedStyles.alignItemsFlexEnd]}>
									<Text style={styles.switchLabelPrimary}>Colaborative</Text>
									<Text style={[styles.switchLabelSecondary, sharedStyles.textAlignRight]}>All users in the channel can write new messages</Text>
								</View>
								<Switch
									style={styles.switch}
									onValueChange={value => this.setState({ ro: value })}
									value={ro}
								/>
								<View style={styles.switchLabelContainer}>
									<Text style={styles.switchLabelPrimary}>Read Only</Text>
									<Text style={styles.switchLabelSecondary}>Only authorized users can write new messages</Text>
								</View>
							</View>
							<View style={styles.divider} />
							{ro &&
								[
									<View style={styles.switchContainer} key='allow-reactions-container'>
										<View style={[styles.switchLabelContainer, sharedStyles.alignItemsFlexEnd]}>
											<Text style={styles.switchLabelPrimary}>No Reactions</Text>
											<Text style={[styles.switchLabelSecondary, sharedStyles.textAlignRight]}>Reactions are disabled</Text>
										</View>
										<Switch
											style={styles.switch}
											onValueChange={value => this.setState({ reactWhenReadOnly: value })}
											value={reactWhenReadOnly}
										/>
										<View style={styles.switchLabelContainer}>
											<Text style={styles.switchLabelPrimary}>Allow Reactions</Text>
											<Text style={styles.switchLabelSecondary}>Reactions are enabled</Text>
										</View>
									</View>,
									<View style={styles.divider} key='allow-reactions-divider' />
								]
							}
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
