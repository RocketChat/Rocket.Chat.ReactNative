import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, ScrollView, TouchableOpacity, SafeAreaView, Keyboard, Alert } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { connect } from 'react-redux';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert, showToast } from '../../utils/info';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import { eraseRoom } from '../../actions/room';
import RCTextInput from '../../containers/TextInput';
import SwitchContainer from './SwitchContainer';
import random from '../../utils/random';

const PERMISSION_SET_READONLY = 'set-readonly';
const PERMISSION_SET_REACT_WHEN_READONLY = 'set-react-when-readonly';
const PERMISSION_ARCHIVE = 'archive-room';
const PERMISSION_UNARCHIVE = 'unarchive-room';
const PERMISSION_DELETE_C = 'delete-c';
const PERMISSION_DELETE_P = 'delete-p';
const PERMISSIONS_ARRAY = [
	PERMISSION_SET_READONLY,
	PERMISSION_SET_REACT_WHEN_READONLY,
	PERMISSION_ARCHIVE,
	PERMISSION_UNARCHIVE,
	PERMISSION_DELETE_C,
	PERMISSION_DELETE_P
];

@connect(null, dispatch => ({
	eraseRoom: rid => dispatch(eraseRoom(rid))
}))
export default class RoomInfoEditView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		eraseRoom: PropTypes.func
	};

	constructor(props) {
		super(props);
		const { rid } = props.navigation.state.params;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.permissions = {};
		this.state = {
			room: {},
			name: '',
			description: '',
			topic: '',
			announcement: '',
			joinCode: '',
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
		this.permissions = RocketChat.hasPermission(PERMISSIONS_ARRAY, this.state.room.rid);
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
			name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCodeRequired
		} = this.state.room;
		// fake password just to user knows about it
		this.randomValue = random(15);
		this.setState({
			name,
			description,
			topic,
			announcement,
			t: t === 'p',
			ro,
			reactWhenReadOnly,
			joinCode: joinCodeRequired ? this.randomValue : ''
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
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCode
		} = this.state;
		return !(room.name === name &&
			room.description === description &&
			room.topic === topic &&
			room.announcement === announcement &&
			this.randomValue === joinCode &&
			room.t === 'p' === t &&
			room.ro === ro &&
			room.reactWhenReadOnly === reactWhenReadOnly
		);
	}

	submit = async() => {
		Keyboard.dismiss();
		const {
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCode
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
		// React When Read Only
		if (room.reactWhenReadOnly !== reactWhenReadOnly) {
			params.reactWhenReadOnly = reactWhenReadOnly;
		}

		// Join Code
		if (this.randomValue !== joinCode) {
			params.joinCode = joinCode;
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

	delete = () => {
		Alert.alert(
			'Are you sure?',
			'Deleting a room will delete all messages posted within the room. This cannot be undone.',
			[
				{
					text: 'Cancel',
					style: 'cancel'
				},
				{
					text: 'Yes, delete it!',
					style: 'destructive',
					onPress: () => this.props.eraseRoom(this.state.room.rid)
				}
			],
			{ cancelable: false }
		);
	}

	toggleArchive = () => {
		const { archived } = this.state.room;
		const action = `${ archived ? 'un' : '' }archive`;
		Alert.alert(
			'Are you sure?',
			`Do you really want to ${ action } this room?`,
			[
				{
					text: 'Cancel',
					style: 'cancel'
				},
				{
					text: `Yes, ${ action } it!`,
					style: 'destructive',
					onPress: () => {
						try {
							RocketChat.toggleArchiveRoom(this.state.room.rid, !archived);
						} catch (error) {
							alert(error);
						}
					}
				}
			],
			{ cancelable: false }
		);
	}

	hasDeletePermission = () => (
		this.state.room.t === 'p' ? this.permissions[PERMISSION_DELETE_P] : this.permissions[PERMISSION_DELETE_C]
	);

	hasArchivePermission = () => (
		this.permissions[PERMISSION_ARCHIVE] || this.permissions[PERMISSION_UNARCHIVE]
	);

	render() {
		const {
			name, nameError, description, topic, announcement, t, ro, reactWhenReadOnly, room, joinCode
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
							<RCTextInput
								inputRef={(e) => { this.name = e; }}
								label='Name'
								value={name}
								onChangeText={value => this.setState({ name: value })}
								onSubmitEditing={() => { this.description.focus(); }}
								error={nameError}
							/>
							<RCTextInput
								inputRef={(e) => { this.description = e; }}
								label='Description'
								value={description}
								onChangeText={value => this.setState({ description: value })}
								onSubmitEditing={() => { this.topic.focus(); }}
								inputProps={{ multiline: true }}
							/>
							<RCTextInput
								inputRef={(e) => { this.topic = e; }}
								label='Topic'
								value={topic}
								onChangeText={value => this.setState({ topic: value })}
								onSubmitEditing={() => { this.announcement.focus(); }}
								inputProps={{ multiline: true }}
							/>
							<RCTextInput
								inputRef={(e) => { this.announcement = e; }}
								label='Announcement'
								value={announcement}
								onChangeText={value => this.setState({ announcement: value })}
								onSubmitEditing={() => { this.joinCode.focus(); }}
								inputProps={{ multiline: true }}
							/>
							<RCTextInput
								inputRef={(e) => { this.joinCode = e; }}
								label='Password'
								value={joinCode}
								onChangeText={value => this.setState({ joinCode: value })}
								onSubmitEditing={this.submit}
								inputProps={{ secureTextEntry: true }}
							/>
							<SwitchContainer
								value={t}
								leftLabelPrimary='Public'
								leftLabelSecondary='Everyone can access this channel'
								rightLabelPrimary='Private'
								rightLabelSecondary='Just invited people can access this channel'
								onValueChange={value => this.setState({ t: value })}
							/>
							<SwitchContainer
								value={ro}
								leftLabelPrimary='Colaborative'
								leftLabelSecondary='All users in the channel can write new messages'
								rightLabelPrimary='Read Only'
								rightLabelSecondary='Only authorized users can write new messages'
								onValueChange={value => this.setState({ ro: value })}
								disabled={!this.permissions[PERMISSION_SET_READONLY]}
							/>
							{ro &&
								<SwitchContainer
									value={reactWhenReadOnly}
									leftLabelPrimary='No Reactions'
									leftLabelSecondary='Reactions are disabled'
									rightLabelPrimary='Allow Reactions'
									rightLabelSecondary='Reactions are enabled'
									onValueChange={value => this.setState({ reactWhenReadOnly: value })}
									disabled={!this.permissions[PERMISSION_SET_REACT_WHEN_READONLY]}
								/>
							}
							<TouchableOpacity
								style={[sharedStyles.buttonContainer, !this.formIsChanged() && styles.buttonContainerDisabled]}
								onPress={this.submit}
								disabled={!this.formIsChanged()}
							>
								<Text style={sharedStyles.button} accessibilityTraits='button'>SAVE</Text>
							</TouchableOpacity>
							<View style={{ flexDirection: 'row' }}>
								<TouchableOpacity
									style={[sharedStyles.buttonContainer_inverted, styles.buttonInverted, { flex: 1 }]}
									onPress={this.reset}
								>
									<Text style={sharedStyles.button_inverted} accessibilityTraits='button'>RESET</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										sharedStyles.buttonContainer_inverted,
										styles.buttonDanger,
										!this.hasArchivePermission() && sharedStyles.opacity5,
										{ flex: 1, marginLeft: 10 }
									]}
									onPress={this.toggleArchive}
									disabled={!this.hasArchivePermission()}
								>
									<Text style={[sharedStyles.button_inverted, styles.colorDanger]} accessibilityTraits='button'>
										{ room.archived ? 'UNARCHIVE' : 'ARCHIVE' }
									</Text>
								</TouchableOpacity>
							</View>
							<View style={styles.divider} />
							<TouchableOpacity
								style={[
									sharedStyles.buttonContainer_inverted,
									sharedStyles.buttonContainerLastChild,
									styles.buttonDanger,
									!this.hasDeletePermission() && sharedStyles.opacity5
								]}
								onPress={this.delete}
								disabled={!this.hasDeletePermission()}
							>
								<Text style={[sharedStyles.button_inverted, styles.colorDanger]} accessibilityTraits='button'>DELETE</Text>
							</TouchableOpacity>
						</View>
						<Spinner visible={this.state.saving} textContent='Loading...' textStyle={{ color: '#FFF' }} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
