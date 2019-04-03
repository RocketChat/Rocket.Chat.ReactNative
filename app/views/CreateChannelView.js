import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
	View, Text, Switch, ScrollView, TextInput, StyleSheet, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';

import Loading from '../containers/Loading';
import LoggedView from './View';
import { createChannelRequest as createChannelRequestAction } from '../actions/createChannel';
import { removeUser as removeUserAction } from '../actions/selectedUsers';
import sharedStyles from './Styles';
import KeyboardView from '../presentation/KeyboardView';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import UserItem from '../presentation/UserItem';
import { showErrorAlert } from '../utils/info';
import { isAndroid } from '../utils/deviceInfo';
import { CustomHeaderButtons, Item } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { COLOR_TEXT_DESCRIPTION, COLOR_WHITE } from '../constants/colors';

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f7f8fa',
		flex: 1
	},
	list: {
		width: '100%',
		backgroundColor: COLOR_WHITE
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
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal,
		backgroundColor: COLOR_WHITE
	},
	swithContainer: {
		height: 54,
		backgroundColor: COLOR_WHITE,
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		paddingHorizontal: 18
	},
	label: {
		fontSize: 17,
		...sharedStyles.textMedium,
		...sharedStyles.textColorNormal
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
		...sharedStyles.textColorNormal,
		lineHeight: 41
	},
	invitedCount: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription
	}
});

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	error: state.createChannel.error,
	failure: state.createChannel.failure,
	isFetching: state.createChannel.isFetching,
	result: state.createChannel.result,
	users: state.selectedUsers.users,
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	}
}), dispatch => ({
	create: data => dispatch(createChannelRequestAction(data)),
	removeUser: user => dispatch(removeUserAction(user))
}))
/** @extends React.Component */
export default class CreateChannelView extends LoggedView {
	static navigationOptions = ({ navigation }) => {
		const submit = navigation.getParam('submit', () => {});
		const showSubmit = navigation.getParam('showSubmit');
		return {
			title: I18n.t('Create_Channel'),
			headerRight: (
				showSubmit
					? (
						<CustomHeaderButtons>
							<Item title={I18n.t('Create')} onPress={submit} testID='create-channel-submit' />
						</CustomHeaderButtons>
					)
					: null
			)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		create: PropTypes.func.isRequired,
		removeUser: PropTypes.func.isRequired,
		error: PropTypes.object,
		failure: PropTypes.bool,
		isFetching: PropTypes.bool,
		result: PropTypes.object,
		users: PropTypes.array.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		})
	};

	constructor(props) {
		super('CreateChannelView', props);
		this.state = {
			channelName: '',
			type: true,
			readOnly: false,
			broadcast: false
		};
	}

	componentDidMount() {
		const { navigation } = this.props;
		navigation.setParams({ submit: this.submit });
		this.timeout = setTimeout(() => {
			this.channelNameRef.focus();
		}, 600);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			channelName, type, readOnly, broadcast
		} = this.state;
		const {
			error, failure, isFetching, result, users
		} = this.props;
		if (nextState.channelName !== channelName) {
			return true;
		}
		if (nextState.type !== type) {
			return true;
		}
		if (nextState.readOnly !== readOnly) {
			return true;
		}
		if (nextState.broadcast !== broadcast) {
			return true;
		}
		if (nextProps.failure !== failure) {
			return true;
		}
		if (nextProps.isFetching !== isFetching) {
			return true;
		}
		if (!equal(nextProps.error, error)) {
			return true;
		}
		if (!equal(nextProps.result, result)) {
			return true;
		}
		if (!equal(nextProps.users, users)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		const {
			isFetching, failure, error, result, navigation
		} = this.props;

		if (!isFetching && isFetching !== prevProps.isFetching) {
			setTimeout(() => {
				if (failure) {
					const msg = error.reason || I18n.t('There_was_an_error_while_action', { action: I18n.t('creating_channel') });
					showErrorAlert(msg);
				} else {
					const { type } = this.state;
					const { rid, name } = result;
					navigation.navigate('RoomView', { rid, name, t: type ? 'p' : 'c' });
				}
			}, 300);
		}
	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	onChangeText = (channelName) => {
		const { navigation } = this.props;
		navigation.setParams({ showSubmit: channelName.trim().length > 0 });
		this.setState({ channelName });
	}

	submit = () => {
		const {
			channelName, type, readOnly, broadcast
		} = this.state;
		const { users: usersProps, isFetching, create } = this.props;

		if (!channelName.trim() || isFetching) {
			return;
		}

		// transform users object into array of usernames
		const users = usersProps.map(user => user.name);

		// create channel
		create({
			name: channelName, users, type, readOnly, broadcast
		});
	}

	removeUser = (user) => {
		const { users, removeUser } = this.props;
		if (users.length === 1) {
			return;
		}
		removeUser(user);
	}

	renderSwitch = ({
		id, value, label, onValueChange, disabled = false
	}) => (
		<View style={styles.swithContainer}>
			<Text style={styles.label}>{I18n.t(label)}</Text>
			<Switch
				value={value}
				onValueChange={onValueChange}
				testID={`create-channel-${ id }`}
				onTintColor='#2de0a5'
				tintColor={isAndroid ? '#f5455c' : null}
				disabled={disabled}
			/>
		</View>
	)

	renderType() {
		const { type } = this.state;
		return this.renderSwitch({
			id: 'type',
			value: type,
			label: 'Private_Channel',
			onValueChange: value => this.setState({ type: value })
		});
	}

	renderReadOnly() {
		const { readOnly, broadcast } = this.state;
		return this.renderSwitch({
			id: 'readonly',
			value: readOnly,
			label: 'Read_Only_Channel',
			onValueChange: value => this.setState({ readOnly: value }),
			disabled: broadcast
		});
	}

	renderBroadcast() {
		const { broadcast, readOnly } = this.state;
		return this.renderSwitch({
			id: 'broadcast',
			value: broadcast,
			label: 'Broadcast_Channel',
			onValueChange: (value) => {
				this.setState({
					broadcast: value,
					readOnly: value ? true : readOnly
				});
			}
		});
	}

	renderSeparator = () => <View style={[sharedStyles.separator, styles.separator]} />

	renderFormSeparator = () => <View style={[sharedStyles.separator, styles.formSeparator]} />

	renderItem = ({ item }) => {
		const { baseUrl, user } = this.props;

		return (
			<UserItem
				name={item.fname}
				username={item.name}
				onPress={() => this.removeUser(item)}
				testID={`create-channel-view-item-${ item.name }`}
				baseUrl={baseUrl}
				user={user}
			/>
		);
	}

	renderInvitedList = () => {
		const { users } = this.props;

		return (
			<FlatList
				data={users}
				extraData={users}
				keyExtractor={item => item._id}
				style={[styles.list, sharedStyles.separatorVertical]}
				renderItem={this.renderItem}
				ItemSeparatorComponent={this.renderSeparator}
				enableEmptySections
				keyboardShouldPersistTaps='always'
			/>
		);
	}

	render() {
		const { channelName } = this.state;
		const { users, isFetching } = this.props;
		const userCount = users.length;

		return (
			<KeyboardView
				contentContainerStyle={[sharedStyles.container, styles.container]}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<SafeAreaView testID='create-channel-view' style={styles.container} forceInset={{ bottom: 'never' }}>
					<ScrollView {...scrollPersistTaps}>
						<View style={sharedStyles.separatorVertical}>
							<TextInput
								ref={ref => this.channelNameRef = ref}
								style={styles.input}
								label={I18n.t('Channel_Name')}
								value={channelName}
								onChangeText={this.onChangeText}
								placeholder={I18n.t('Channel_Name')}
								placeholderTextColor={COLOR_TEXT_DESCRIPTION}
								returnKeyType='done'
								testID='create-channel-name'
								autoCorrect={false}
								autoCapitalize='none'
								underlineColorAndroid='transparent'
							/>
							{this.renderFormSeparator()}
							{this.renderType()}
							{this.renderFormSeparator()}
							{this.renderReadOnly()}
							{this.renderFormSeparator()}
							{this.renderBroadcast()}
						</View>
						<View style={styles.invitedHeader}>
							<Text style={styles.invitedTitle}>{I18n.t('Invite')}</Text>
							<Text style={styles.invitedCount}>{userCount === 1 ? I18n.t('1_user') : I18n.t('N_users', { n: userCount })}</Text>
						</View>
						{this.renderInvitedList()}
						<Loading visible={isFetching} />
					</ScrollView>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}
