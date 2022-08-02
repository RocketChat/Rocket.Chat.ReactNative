import React from 'react';
import { connect } from 'react-redux';
import { FlatList, ScrollView, StyleSheet, Switch, Text, View, SwitchProps } from 'react-native';
import { dequal } from 'dequal';

import SearchBox from '../containers/SearchBox';
import Loading from '../containers/Loading';
import { createChannelRequest } from '../actions/createChannel';
import { removeUser } from '../actions/selectedUsers';
import KeyboardView from '../containers/KeyboardView';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import { SWITCH_TRACK_COLOR, themes } from '../lib/constants';
import { withTheme } from '../theme';
import { Review } from '../lib/methods/helpers/review';
import { getUserSelector } from '../selectors/login';
import { events, logEvent } from '../lib/methods/helpers/log';
import SafeAreaView from '../containers/SafeAreaView';
import sharedStyles from './Styles';
import { ChatsStackParamList } from '../stacks/types';
import { IApplicationState, IBaseScreen, IUser } from '../definitions';
import { hasPermission } from '../lib/methods/helpers';
import Chip from '../containers/Chip';
import Button from '../containers/Button';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	list: {
		width: '100%'
	},
	switchContainer: {
		minHeight: 54,
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		paddingHorizontal: 16,
		maxHeight: 80,
		marginBottom: 8
	},
	switchTextContainer: {
		flex: 1,
		marginRight: 8
	},
	label: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	hint: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	invitedHeader: {
		marginTop: 18,
		marginHorizontal: 15,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	invitedCount: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	buttonCreate: {
		marginHorizontal: 16,
		marginTop: 24
	}
});

interface IOtherUser {
	_id: string;
	name: string;
	fname: string;
}

interface ICreateChannelViewState {
	channelName: string;
	type: boolean;
	readOnly: boolean;
	encrypted: boolean;
	broadcast: boolean;
	isTeam: boolean;
	permissions: boolean[];
}

interface ICreateChannelViewProps extends IBaseScreen<ChatsStackParamList, 'CreateChannelView'> {
	baseUrl: string;
	error: object;
	failure: boolean;
	isFetching: boolean;
	encryptionEnabled: boolean;
	users: IOtherUser[];
	user: IUser;
	teamId: string;
	createPublicChannelPermission: string[] | undefined;
	createPrivateChannelPermission: string[] | undefined;
	useRealName: boolean;
}

interface ISwitch extends SwitchProps {
	id: string;
	label: string;
	hint: string;
}

class CreateChannelView extends React.Component<ICreateChannelViewProps, ICreateChannelViewState> {
	private teamId?: string;

	constructor(props: ICreateChannelViewProps) {
		super(props);
		const { route } = this.props;
		const isTeam = route?.params?.isTeam || false;
		this.teamId = route?.params?.teamId;
		this.state = {
			channelName: '',
			type: true,
			readOnly: false,
			encrypted: false,
			broadcast: false,
			isTeam,
			permissions: []
		};
		this.setHeader();
	}

	componentDidMount() {
		this.handleHasPermission();
	}

	shouldComponentUpdate(nextProps: ICreateChannelViewProps, nextState: ICreateChannelViewState) {
		const { channelName, type, readOnly, broadcast, encrypted, permissions } = this.state;
		const { users, isFetching, encryptionEnabled, theme, createPublicChannelPermission, createPrivateChannelPermission } =
			this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.channelName !== channelName) {
			return true;
		}
		if (nextState.type !== type) {
			return true;
		}
		if (nextState.readOnly !== readOnly) {
			return true;
		}
		if (nextState.encrypted !== encrypted) {
			return true;
		}
		if (nextState.broadcast !== broadcast) {
			return true;
		}
		if (nextState.permissions !== permissions) {
			return true;
		}
		if (nextProps.isFetching !== isFetching) {
			return true;
		}
		if (nextProps.encryptionEnabled !== encryptionEnabled) {
			return true;
		}
		if (!dequal(nextProps.createPublicChannelPermission, createPublicChannelPermission)) {
			return true;
		}
		if (!dequal(nextProps.createPrivateChannelPermission, createPrivateChannelPermission)) {
			return true;
		}
		if (!dequal(nextProps.users, users)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps: ICreateChannelViewProps) {
		const { createPublicChannelPermission, createPrivateChannelPermission } = this.props;
		if (
			!dequal(createPublicChannelPermission, prevProps.createPublicChannelPermission) ||
			!dequal(createPrivateChannelPermission, prevProps.createPrivateChannelPermission)
		) {
			this.handleHasPermission();
		}
	}

	setHeader = () => {
		const { navigation } = this.props;
		const { isTeam } = this.state;

		navigation.setOptions({
			title: isTeam ? I18n.t('Create_Team') : I18n.t('Create_Channel')
		});
	};

	onChangeText = (channelName: string) => {
		this.setState({ channelName });
	};

	submit = () => {
		const { channelName, type, readOnly, broadcast, encrypted, isTeam } = this.state;
		const { users: usersProps, isFetching, dispatch } = this.props;

		if (!channelName.trim() || isFetching) {
			return;
		}

		// transform users object into array of usernames
		const users = usersProps.map(user => user.name);

		// create channel or team
		const data = {
			name: channelName,
			users,
			type,
			readOnly,
			broadcast,
			encrypted,
			isTeam,
			teamId: this.teamId
		};
		dispatch(createChannelRequest(data));
		Review.pushPositiveEvent();
	};

	removeUser = (user: IOtherUser) => {
		logEvent(events.CR_REMOVE_USER);
		const { dispatch } = this.props;
		dispatch(removeUser(user));
	};

	renderSwitch = ({ id, value, label, hint, onValueChange, disabled = false }: ISwitch) => {
		const { theme } = this.props;
		return (
			<View style={[styles.switchContainer, { backgroundColor: themes[theme].backgroundColor }]}>
				<View style={styles.switchTextContainer}>
					<Text style={[styles.label, { color: themes[theme].titleText }]}>{I18n.t(label)}</Text>
					<Text style={[styles.hint, { color: themes[theme].auxiliaryText }]}>{I18n.t(hint)}</Text>
				</View>
				<Switch
					value={value}
					onValueChange={onValueChange}
					testID={`create-channel-${id}`}
					trackColor={SWITCH_TRACK_COLOR}
					disabled={disabled}
				/>
			</View>
		);
	};

	handleHasPermission = async () => {
		const { createPublicChannelPermission, createPrivateChannelPermission } = this.props;
		const permissions = [createPublicChannelPermission, createPrivateChannelPermission];
		const permissionsToCreate = await hasPermission(permissions);
		this.setState({ permissions: permissionsToCreate });
	};

	renderType() {
		const { type, isTeam, permissions } = this.state;
		const isDisabled = permissions.filter(r => r === true).length <= 1;

		let hint = '';
		if (isTeam && type) {
			hint = 'Team_hint_private';
		}
		if (isTeam && !type) {
			hint = 'Team_hint_public';
		}
		if (!isTeam && type) {
			hint = 'Channel_hint_private';
		}
		if (!isTeam && !type) {
			hint = 'Channel_hint_public';
		}

		return this.renderSwitch({
			id: 'type',
			value: permissions[1] ? type : false,
			disabled: isDisabled,
			label: 'Private',
			hint,
			onValueChange: (value: boolean) => {
				logEvent(events.CR_TOGGLE_TYPE);
				// If we set the channel as public, encrypted status should be false
				this.setState(({ encrypted }) => ({ type: value, encrypted: value && encrypted }));
			}
		});
	}

	renderReadOnly() {
		const { readOnly, broadcast, isTeam } = this.state;

		let hint = '';
		if (readOnly) {
			hint = 'Read_only_hint';
		}
		if (isTeam && !readOnly) {
			hint = 'Team_hint_not_read_only';
		}
		if (!isTeam && !readOnly) {
			hint = 'Channel_hint_not_read_only';
		}

		return this.renderSwitch({
			id: 'readonly',
			value: readOnly,
			label: 'Read_Only',
			hint,
			onValueChange: value => {
				logEvent(events.CR_TOGGLE_READ_ONLY);
				this.setState({ readOnly: value });
			},
			disabled: broadcast
		});
	}

	renderEncrypted() {
		const { type, encrypted, isTeam } = this.state;
		const { encryptionEnabled } = this.props;

		if (!encryptionEnabled) {
			return null;
		}

		let hint = '';
		if (isTeam && type) {
			hint = 'Team_hint_encrypted';
		}
		if (isTeam && !type) {
			hint = 'Team_hint_encrypted_not_available';
		}
		if (!isTeam && type) {
			hint = 'Channel_hint_encrypted';
		}
		if (!isTeam && !type) {
			hint = 'Channel_hint_encrypted_not_available';
		}

		return this.renderSwitch({
			id: 'encrypted',
			value: encrypted,
			label: 'Encrypted',
			hint,
			onValueChange: value => {
				logEvent(events.CR_TOGGLE_ENCRYPTED);
				this.setState({ encrypted: value });
			},
			disabled: !type
		});
	}

	renderBroadcast() {
		const { broadcast, readOnly } = this.state;

		return this.renderSwitch({
			id: 'broadcast',
			value: broadcast,
			label: 'Broadcast',
			hint: 'Broadcast_hint',
			onValueChange: value => {
				logEvent(events.CR_TOGGLE_BROADCAST);
				this.setState({
					broadcast: value,
					readOnly: value ? true : readOnly
				});
			}
		});
	}

	renderItem = ({ item }: { item: IOtherUser }) => {
		const { useRealName } = this.props;
		const name = useRealName && item.fname ? item.fname : item.name;
		const username = item.name;

		return (
			<Chip
				item={item}
				name={name}
				username={username}
				onPress={() => this.removeUser(item)}
				testID={`create-channel-view-item-${item.name}`}
			/>
		);
	};

	renderInvitedList = () => {
		const { users, theme } = this.props;

		return (
			<FlatList
				data={users}
				extraData={users}
				keyExtractor={item => item._id}
				style={[
					styles.list,
					{
						backgroundColor: themes[theme].backgroundColor,
						borderColor: themes[theme].separatorColor
					}
				]}
				contentContainerStyle={{ paddingLeft: 16 }}
				renderItem={this.renderItem}
				keyboardShouldPersistTaps='always'
				horizontal
			/>
		);
	};

	render() {
		const { isTeam, channelName } = this.state;
		const { users, isFetching, theme } = this.props;
		const userCount = users.length;

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={[sharedStyles.container, styles.container]}
				keyboardVerticalOffset={128}>
				<StatusBar />
				<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='create-channel-view'>
					<ScrollView {...scrollPersistTaps}>
						<View style={{ borderColor: themes[theme].separatorColor }}>
							<SearchBox
								label={isTeam ? I18n.t('Team_Name') : I18n.t('Channel_Name')}
								onChangeText={this.onChangeText}
								testID='create-channel-name'
								returnKeyType='done'
							/>
							{this.renderType()}
							{this.renderReadOnly()}
							{this.renderEncrypted()}
							{this.renderBroadcast()}
						</View>
						{userCount > 0 ? (
							<>
								<View style={styles.invitedHeader}>
									<Text style={[styles.invitedCount, { color: themes[theme].auxiliaryText }]}>
										{I18n.t('N_Selected_members', { n: userCount })}
									</Text>
								</View>
								{this.renderInvitedList()}
							</>
						) : null}
						<Button
							title={isTeam ? I18n.t('Create_Team') : I18n.t('Create_Channel')}
							type='primary'
							onPress={this.submit}
							disabled={!(channelName.trim().length > 0)}
							testID='create-channel-submit'
							loading={isFetching}
							style={styles.buttonCreate}
						/>
						<Loading visible={isFetching} />
					</ScrollView>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	isFetching: state.createChannel.isFetching,
	encryptionEnabled: state.encryption.enabled,
	users: state.selectedUsers.users,
	user: getUserSelector(state),
	createPublicChannelPermission: state.permissions['create-c'],
	createPrivateChannelPermission: state.permissions['create-p'],
	useRealName: state.settings.UI_Use_Real_Name as boolean
});

export default connect(mapStateToProps)(withTheme(CreateChannelView));
