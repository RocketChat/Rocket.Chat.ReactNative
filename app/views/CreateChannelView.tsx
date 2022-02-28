import React from 'react';
import { connect } from 'react-redux';
import { FlatList, ScrollView, StyleSheet, Switch, Text, View, SwitchProps } from 'react-native';
import { dequal } from 'dequal';

import * as List from '../containers/List';
import TextInput from '../presentation/TextInput';
import Loading from '../containers/Loading';
import { createChannelRequest } from '../actions/createChannel';
import { removeUser } from '../actions/selectedUsers';
import KeyboardView from '../presentation/KeyboardView';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import UserItem from '../presentation/UserItem';
import * as HeaderButton from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { SWITCH_TRACK_COLOR, themes } from '../constants/colors';
import { withTheme } from '../theme';
import { Review } from '../utils/review';
import { getUserSelector } from '../selectors/login';
import { events, logEvent } from '../utils/log';
import SafeAreaView from '../containers/SafeAreaView';
import RocketChat from '../lib/rocketchat';
import sharedStyles from './Styles';
import { ChatsStackParamList } from '../stacks/types';
import { IApplicationState, IBaseScreen } from '../definitions';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	list: {
		width: '100%'
	},
	input: {
		height: 54,
		paddingHorizontal: 18,
		fontSize: 17,
		...sharedStyles.textRegular
	},
	switchContainer: {
		height: 54,
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		paddingHorizontal: 18
	},
	label: {
		fontSize: 17,
		...sharedStyles.textMedium
	},
	invitedHeader: {
		marginTop: 18,
		marginHorizontal: 15,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	invitedTitle: {
		fontSize: 18,
		...sharedStyles.textSemibold,
		lineHeight: 41
	},
	invitedCount: {
		fontSize: 14,
		...sharedStyles.textRegular
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
	user: {
		id: string;
		token: string;
		roles: string[];
	};
	teamId: string;
	createPublicChannelPermission: string[] | undefined;
	createPrivateChannelPermission: string[] | undefined;
}

interface ISwitch extends SwitchProps {
	id: string;
	label: string;
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

	toggleRightButton = (channelName: string) => {
		const { navigation } = this.props;
		navigation.setOptions({
			headerRight: () =>
				channelName.trim().length > 0 && (
					<HeaderButton.Container>
						<HeaderButton.Item title={I18n.t('Create')} onPress={this.submit} testID='create-channel-submit' />
					</HeaderButton.Container>
				)
		});
	};

	onChangeText = (channelName: string) => {
		this.toggleRightButton(channelName);
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
			teamId: this.teamId!
		};
		dispatch(createChannelRequest(data));
		Review.pushPositiveEvent();
	};

	removeUser = (user: IOtherUser) => {
		logEvent(events.CR_REMOVE_USER);
		const { dispatch } = this.props;
		dispatch(removeUser(user));
	};

	renderSwitch = ({ id, value, label, onValueChange, disabled = false }: ISwitch) => {
		const { theme } = this.props;
		return (
			<View style={[styles.switchContainer, { backgroundColor: themes[theme].backgroundColor }]}>
				<Text style={[styles.label, { color: themes[theme].titleText }]}>{I18n.t(label)}</Text>
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
		const permissionsToCreate = await RocketChat.hasPermission(permissions);
		this.setState({ permissions: permissionsToCreate });
	};

	renderType() {
		const { type, isTeam, permissions } = this.state;
		const isDisabled = permissions.filter(r => r === true).length <= 1;

		return this.renderSwitch({
			id: 'type',
			value: permissions[1] ? type : false,
			disabled: isDisabled,
			label: isTeam ? 'Private_Team' : 'Private_Channel',
			onValueChange: (value: boolean) => {
				logEvent(events.CR_TOGGLE_TYPE);
				// If we set the channel as public, encrypted status should be false
				this.setState(({ encrypted }) => ({ type: value, encrypted: value && encrypted }));
			}
		});
	}

	renderReadOnly() {
		const { readOnly, broadcast, isTeam } = this.state;

		return this.renderSwitch({
			id: 'readonly',
			value: readOnly,
			label: isTeam ? 'Read_Only_Team' : 'Read_Only_Channel',
			onValueChange: value => {
				logEvent(events.CR_TOGGLE_READ_ONLY);
				this.setState({ readOnly: value });
			},
			disabled: broadcast
		});
	}

	renderEncrypted() {
		const { type, encrypted } = this.state;
		const { encryptionEnabled } = this.props;

		if (!encryptionEnabled) {
			return null;
		}

		return this.renderSwitch({
			id: 'encrypted',
			value: encrypted,
			label: 'Encrypted',
			onValueChange: value => {
				logEvent(events.CR_TOGGLE_ENCRYPTED);
				this.setState({ encrypted: value });
			},
			disabled: !type
		});
	}

	renderBroadcast() {
		const { broadcast, readOnly, isTeam } = this.state;

		return this.renderSwitch({
			id: 'broadcast',
			value: broadcast,
			label: isTeam ? 'Broadcast_Team' : 'Broadcast_Channel',
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
		const { theme } = this.props;

		return (
			<UserItem
				name={item.fname}
				username={item.name}
				onPress={() => this.removeUser(item)}
				testID={`create-channel-view-item-${item.name}`}
				icon='check'
				theme={theme}
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
					sharedStyles.separatorVertical,
					{
						backgroundColor: themes[theme].focusedBackground,
						borderColor: themes[theme].separatorColor
					}
				]}
				renderItem={this.renderItem}
				ItemSeparatorComponent={List.Separator}
				keyboardShouldPersistTaps='always'
			/>
		);
	};

	render() {
		const { channelName, isTeam } = this.state;
		const { users, isFetching, theme } = this.props;
		const userCount = users.length;

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].auxiliaryBackground }}
				contentContainerStyle={[sharedStyles.container, styles.container]}
				keyboardVerticalOffset={128}>
				<StatusBar />
				<SafeAreaView testID='create-channel-view'>
					<ScrollView {...scrollPersistTaps}>
						<View style={[sharedStyles.separatorVertical, { borderColor: themes[theme].separatorColor }]}>
							<TextInput
								autoFocus
								style={[styles.input, { backgroundColor: themes[theme].backgroundColor }]}
								value={channelName}
								onChangeText={this.onChangeText}
								placeholder={isTeam ? I18n.t('Team_Name') : I18n.t('Channel_Name')}
								returnKeyType='done'
								testID='create-channel-name'
								autoCorrect={false}
								autoCapitalize='none'
								theme={theme}
								underlineColorAndroid='transparent'
							/>
							<List.Separator />
							{this.renderType()}
							<List.Separator />
							{this.renderReadOnly()}
							<List.Separator />
							{this.renderEncrypted()}
							<List.Separator />
							{this.renderBroadcast()}
						</View>
						<View style={styles.invitedHeader}>
							<Text style={[styles.invitedTitle, { color: themes[theme].titleText }]}>{I18n.t('Invite')}</Text>
							<Text style={[styles.invitedCount, { color: themes[theme].auxiliaryText }]}>
								{userCount === 1 ? I18n.t('1_user') : I18n.t('N_users', { n: userCount })}
							</Text>
						</View>
						{this.renderInvitedList()}
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
	createPrivateChannelPermission: state.permissions['create-p']
});

export default connect(mapStateToProps)(withTheme(CreateChannelView));
