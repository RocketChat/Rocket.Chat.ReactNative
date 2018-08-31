import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { View, Text, Switch, SafeAreaView, ScrollView, TextInput, StyleSheet, FlatList, Platform } from 'react-native';

import Loading from '../containers/Loading';
import LoggedView from './View';
import { createChannelRequest } from '../actions/createChannel';
import { removeUser } from '../actions/selectedUsers';
import sharedStyles from './Styles';
import KeyboardView from '../presentation/KeyboardView';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import UserItem from '../presentation/UserItem';
import { showErrorAlert } from '../utils/info';

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f7f8fa'
	},
	list: {
		width: '100%',
		backgroundColor: '#FFFFFF'
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
		color: '#9EA2A8',
		backgroundColor: '#fff',
		fontSize: 18
	},
	swithContainer: {
		height: 54,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		paddingHorizontal: 18
	},
	label: {
		color: '#0C0D0F',
		fontSize: 18,
		fontWeight: '500'
	},
	invitedHeader: {
		marginTop: 18,
		marginHorizontal: 15,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	invitedTitle: {
		color: '#2F343D',
		fontSize: 22,
		fontWeight: 'bold',
		lineHeight: 41
	},
	invitedCount: {
		color: '#9EA2A8',
		fontSize: 15
	}
});

@connect(state => ({
	createChannel: state.createChannel,
	users: state.selectedUsers.users
}), dispatch => ({
	create: data => dispatch(createChannelRequest(data)),
	removeUser: user => dispatch(removeUser(user))
}))
/** @extends React.Component */
export default class CreateChannelView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		create: PropTypes.func.isRequired,
		removeUser: PropTypes.func.isRequired,
		createChannel: PropTypes.object.isRequired,
		users: PropTypes.array.isRequired
	};

	constructor(props) {
		super('CreateChannelView', props);
		this.state = {
			channelName: '',
			type: true,
			readOnly: false,
			broadcast: false
		};
		props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentDidMount() {
		setTimeout(() => {
			this.channelNameRef.focus();
		}, 600);
	}

	componentDidUpdate(prevProps) {
		if (this.props.createChannel.error && prevProps.createChannel.error !== this.props.createChannel.error) {
			setTimeout(() => {
				const msg = this.props.createChannel.error.reason || I18n.t('There_was_an_error_while_action', { action: I18n.t('creating_channel') });
				showErrorAlert(msg);
			}, 300);
		}
	}

	onChangeText = (channelName) => {
		const rightButtons = [];
		if (channelName.trim().length > 0) {
			rightButtons.push({
				id: 'create',
				title: 'Create',
				testID: 'create-channel-submit'
			});
		}
		this.props.navigator.setButtons({ rightButtons });
		this.setState({ channelName });
	}

	async onNavigatorEvent(event) {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'create') {
				this.submit();
			}
		}
	}

	submit = () => {
		if (!this.state.channelName.trim() || this.props.createChannel.isFetching) {
			return;
		}
		const {
			channelName, type, readOnly, broadcast
		} = this.state;
		let { users } = this.props;

		// transform users object into array of usernames
		users = users.map(user => user.name);

		// create channel
		this.props.create({
			name: channelName, users, type, readOnly, broadcast
		});
	}

	removeUser = (user) => {
		if (this.props.users.length === 1) {
			return;
		}
		this.props.removeUser(user);
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
				tintColor={Platform.OS === 'android' ? '#f5455c' : null}
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

	renderItem = ({ item }) => (
		<UserItem
			name={item.fname}
			username={item.name}
			onPress={() => this.removeUser(item)}
			testID={`create-channel-view-item-${ item.name }`}
		/>
	)

	renderInvitedList = () => (
		<FlatList
			data={this.props.users}
			extraData={this.props.users}
			keyExtractor={item => item._id}
			style={[styles.list, sharedStyles.separatorVertical]}
			renderItem={this.renderItem}
			ItemSeparatorComponent={this.renderSeparator}
			enableEmptySections
			keyboardShouldPersistTaps='always'
		/>
	)

	render() {
		const userCount = this.props.users.length;
		return (
			<KeyboardView
				contentContainerStyle={[sharedStyles.container, styles.container]}
				keyboardVerticalOffset={128}
			>
				<SafeAreaView testID='create-channel-view'>
					<ScrollView {...scrollPersistTaps}>
						<View style={sharedStyles.separatorVertical}>
							<TextInput
								ref={ref => this.channelNameRef = ref}
								style={styles.input}
								label={I18n.t('Channel_Name')}
								value={this.state.channelName}
								onChangeText={this.onChangeText}
								placeholder={I18n.t('Channel_Name')}
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
						<Loading visible={this.props.createChannel.isFetching} />
					</ScrollView>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}
