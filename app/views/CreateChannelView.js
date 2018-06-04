import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { View, Text, Switch, SafeAreaView, ScrollView, Platform } from 'react-native';

import RCTextInput from '../containers/TextInput';
import Loading from '../containers/Loading';
import LoggedView from './View';
import { createChannelRequest } from '../actions/createChannel';
import styles from './Styles';
import KeyboardView from '../presentation/KeyboardView';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import Button from '../containers/Button';
import I18n from '../i18n';

@connect(
	state => ({
		createChannel: state.createChannel,
		users: state.selectedUsers.users
	}),
	dispatch => ({
		create: data => dispatch(createChannelRequest(data))
	})
)
export default class CreateChannelView extends LoggedView {
	static propTypes = {
		create: PropTypes.func.isRequired,
		createChannel: PropTypes.object.isRequired,
		users: PropTypes.array.isRequired,
		navigation: PropTypes.object.isRequired
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

	renderChannelNameError() {
		if (
			!this.props.createChannel.failure ||
			this.props.createChannel.error.error !== 'error-duplicate-channel-name'
		) {
			return null;
		}

		return (
			<Text style={[styles.label_white, styles.label_error]} testID='create-channel-error'>
				{this.props.createChannel.error.reason}
			</Text>
		);
	}

	renderSwitch = ({
		id, value, label, description, onValueChange, disabled = false
	}) => (
		<View style={{ marginBottom: 15 }}>
			<View style={styles.switchContainer}>
				<Switch
					value={value}
					onValueChange={onValueChange}
					testID={`create-channel-${ id }`}
					onTintColor='#2de0a5'
					tintColor={Platform.OS === 'android' ? '#f5455c' : null}
					disabled={disabled}
				/>
				<Text style={styles.switchLabel}>{label}</Text>
			</View>
			<Text style={styles.switchDescription}>{description}</Text>
		</View>
	);

	renderType() {
		const { type } = this.state;
		return this.renderSwitch({
			id: 'type',
			value: type,
			label: type ? I18n.t('Private_Channel') : I18n.t('Public_Channel'),
			description: type ? I18n.t('Just_invited_people_can_access_this_channel') : I18n.t('Everyone_can_access_this_channel'),
			onValueChange: value => this.setState({ type: value })
		});
	}

	renderReadOnly() {
		const { readOnly, broadcast } = this.state;
		return this.renderSwitch({
			id: 'readonly',
			value: readOnly,
			label: I18n.t('Read_Only_Channel'),
			description: readOnly ? I18n.t('Only_authorized_users_can_write_new_messages') : I18n.t('All_users_in_the_channel_can_write_new_messages'),
			onValueChange: value => this.setState({ readOnly: value }),
			disabled: broadcast
		});
	}

	renderBroadcast() {
		const { broadcast, readOnly } = this.state;
		return this.renderSwitch({
			id: 'broadcast',
			value: broadcast,
			label: I18n.t('Broadcast_Channel'),
			description: I18n.t('Broadcast_channel_Description'),
			onValueChange: (value) => {
				this.setState({
					broadcast: value,
					readOnly: value ? true : readOnly
				});
			}
		});
	}

	render() {
		return (
			<KeyboardView
				contentContainerStyle={styles.container}
				keyboardVerticalOffset={128}
			>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.containerScrollView}>
					<SafeAreaView testID='create-channel-view'>
						<RCTextInput
							label={I18n.t('Channel_Name')}
							value={this.state.channelName}
							onChangeText={channelName => this.setState({ channelName })}
							placeholder={I18n.t('Type_the_channel_name_here')}
							returnKeyType='done'
							autoFocus
							testID='create-channel-name'
						/>
						{this.renderChannelNameError()}
						{this.renderType()}
						{this.renderReadOnly()}
						{this.renderBroadcast()}
						<View style={styles.alignItemsFlexStart}>
							<Button
								title={I18n.t('Create')}
								type='primary'
								onPress={this.submit}
								disabled={this.state.channelName.length === 0 || this.props.createChannel.isFetching}
								testID='create-channel-submit'
							/>
						</View>
						<Loading visible={this.props.createChannel.isFetching} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
