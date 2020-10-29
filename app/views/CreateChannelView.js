import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
	View, Text, Switch, ScrollView, StyleSheet, FlatList
} from 'react-native';
import equal from 'deep-equal';

import TextInput from '../presentation/TextInput';
import Loading from '../containers/Loading';
import { createChannelRequest as createChannelRequestAction } from '../actions/createChannel';
import { removeUser as removeUserAction } from '../actions/selectedUsers';
import sharedStyles from './Styles';
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
import { logEvent, events } from '../utils/log';
import SafeAreaView from '../containers/SafeAreaView';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	list: {
		width: '100%'
	},
	separator: {
		marginLeft: 60
	},
	formSeparator: {
		marginLeft: 15
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

class CreateChannelView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Create_Channel')
	});

	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		create: PropTypes.func.isRequired,
		removeUser: PropTypes.func.isRequired,
		error: PropTypes.object,
		failure: PropTypes.bool,
		isFetching: PropTypes.bool,
		e2eEnabled: PropTypes.bool,
		users: PropTypes.array.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		theme: PropTypes.string
	};

	state = {
		channelName: '',
		type: true,
		readOnly: false,
		encrypted: false,
		broadcast: false
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			channelName, type, readOnly, broadcast, encrypted
		} = this.state;
		const {
			users, isFetching, e2eEnabled, theme
		} = this.props;
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
		if (nextProps.isFetching !== isFetching) {
			return true;
		}
		if (nextProps.e2eEnabled !== e2eEnabled) {
			return true;
		}
		if (!equal(nextProps.users, users)) {
			return true;
		}
		return false;
	}

	toggleRightButton = (channelName) => {
		const { navigation } = this.props;
		navigation.setOptions({
			headerRight: () => channelName.trim().length > 0 && (
				<HeaderButton.Container>
					<HeaderButton.Item title={I18n.t('Create')} onPress={this.submit} testID='create-channel-submit' />
				</HeaderButton.Container>
			)
		});
	}

	onChangeText = (channelName) => {
		this.toggleRightButton(channelName);
		this.setState({ channelName });
	}

	submit = () => {
		const {
			channelName, type, readOnly, broadcast, encrypted
		} = this.state;
		const { users: usersProps, isFetching, create } = this.props;

		if (!channelName.trim() || isFetching) {
			return;
		}

		// transform users object into array of usernames
		const users = usersProps.map(user => user.name);

		// create channel
		create({
			name: channelName, users, type, readOnly, broadcast, encrypted
		});

		Review.pushPositiveEvent();
	}

	removeUser = (user) => {
		logEvent(events.CREATE_CHANNEL_REMOVE_USER);
		const { removeUser } = this.props;
		removeUser(user);
	}

	renderSwitch = ({
		id, value, label, onValueChange, disabled = false
	}) => {
		const { theme } = this.props;
		return (
			<View style={[styles.switchContainer, { backgroundColor: themes[theme].backgroundColor }]}>
				<Text style={[styles.label, { color: themes[theme].titleText }]}>{I18n.t(label)}</Text>
				<Switch
					value={value}
					onValueChange={onValueChange}
					testID={`create-channel-${ id }`}
					trackColor={SWITCH_TRACK_COLOR}
					disabled={disabled}
				/>
			</View>
		);
	}

	renderType() {
		const { type } = this.state;
		return this.renderSwitch({
			id: 'type',
			value: type,
			label: 'Private_Channel',
			onValueChange: (value) => {
				logEvent(events.CREATE_CHANNEL_TOGGLE_TYPE);
				// If we set the channel as public, encrypted status should be false
				this.setState(({ encrypted }) => ({ type: value, encrypted: value && encrypted }));
			}
		});
	}

	renderReadOnly() {
		const { readOnly, broadcast } = this.state;
		return this.renderSwitch({
			id: 'readonly',
			value: readOnly,
			label: 'Read_Only_Channel',
			onValueChange: (value) => {
				logEvent(events.CREATE_CHANNEL_TOGGLE_READ_ONLY);
				this.setState({ readOnly: value });
			},
			disabled: broadcast
		});
	}

	renderEncrypted() {
		const { type, encrypted } = this.state;
		const { e2eEnabled } = this.props;

		if (!e2eEnabled) {
			return null;
		}

		return this.renderSwitch({
			id: 'encrypted',
			value: encrypted,
			label: 'Encrypted',
			onValueChange: (value) => {
				logEvent(events.CREATE_CHANNEL_TOGGLE_ENCRYPTED);
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
			label: 'Broadcast_Channel',
			onValueChange: (value) => {
				logEvent(events.CREATE_CHANNEL_TOGGLE_BROADCAST);
				this.setState({
					broadcast: value,
					readOnly: value ? true : readOnly
				});
			}
		});
	}

	renderSeparator = () => <View style={[sharedStyles.separator, styles.separator]} />

	renderFormSeparator = () => {
		const { theme } = this.props;
		return <View style={[sharedStyles.separator, styles.formSeparator, { backgroundColor: themes[theme].separatorColor }]} />;
	}

	renderItem = ({ item }) => {
		const { baseUrl, user, theme } = this.props;

		return (
			<UserItem
				name={item.fname}
				username={item.name}
				onPress={() => this.removeUser(item)}
				testID={`create-channel-view-item-${ item.name }`}
				icon='check'
				baseUrl={baseUrl}
				user={user}
				theme={theme}
			/>
		);
	}

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
				ItemSeparatorComponent={this.renderSeparator}
				enableEmptySections
				keyboardShouldPersistTaps='always'
			/>
		);
	}

	render() {
		const { channelName } = this.state;
		const { users, isFetching, theme } = this.props;
		const userCount = users.length;

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].auxiliaryBackground }}
				contentContainerStyle={[sharedStyles.container, styles.container]}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<SafeAreaView testID='create-channel-view'>
					<ScrollView {...scrollPersistTaps}>
						<View style={[sharedStyles.separatorVertical, { borderColor: themes[theme].separatorColor }]}>
							<TextInput
								autoFocus
								style={[styles.input, { backgroundColor: themes[theme].backgroundColor }]}
								label={I18n.t('Channel_Name')}
								value={channelName}
								onChangeText={this.onChangeText}
								placeholder={I18n.t('Channel_Name')}
								returnKeyType='done'
								testID='create-channel-name'
								autoCorrect={false}
								autoCapitalize='none'
								theme={theme}
								underlineColorAndroid='transparent'
							/>
							{this.renderFormSeparator()}
							{this.renderType()}
							{this.renderFormSeparator()}
							{this.renderReadOnly()}
							{this.renderFormSeparator()}
							{this.renderEncrypted()}
							{this.renderFormSeparator()}
							{this.renderBroadcast()}
						</View>
						<View style={styles.invitedHeader}>
							<Text style={[styles.invitedTitle, { color: themes[theme].titleText }]}>{I18n.t('Invite')}</Text>
							<Text style={[styles.invitedCount, { color: themes[theme].auxiliaryText }]}>{userCount === 1 ? I18n.t('1_user') : I18n.t('N_users', { n: userCount })}</Text>
						</View>
						{this.renderInvitedList()}
						<Loading visible={isFetching} />
					</ScrollView>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	isFetching: state.createChannel.isFetching,
	e2eEnabled: state.settings.E2E_Enable,
	users: state.selectedUsers.users,
	user: getUserSelector(state)
});

const mapDispatchToProps = dispatch => ({
	create: data => dispatch(createChannelRequestAction(data)),
	removeUser: user => dispatch(removeUserAction(user))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(CreateChannelView));
