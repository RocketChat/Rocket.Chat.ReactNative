import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
	View, Text, Switch, ScrollView, StyleSheet, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-navigation';
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
import { CustomHeaderButtons, Item } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { SWITCH_TRACK_COLOR, themes } from '../constants/colors';
import { withTheme } from '../theme';
import { themedHeader } from '../utils/navigation';
import { Review } from '../utils/review';
import { getUserSelector } from '../selectors/login';

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
	static navigationOptions = ({ navigation, screenProps }) => {
		const submit = navigation.getParam('submit', () => {});
		const showSubmit = navigation.getParam('showSubmit');
		return {
			...themedHeader(screenProps.theme),
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
		broadcast: false
	}

	componentDidMount() {
		const { navigation } = this.props;
		navigation.setParams({ submit: this.submit });
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			channelName, type, readOnly, broadcast
		} = this.state;
		const { users, isFetching, theme } = this.props;
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
		if (nextState.broadcast !== broadcast) {
			return true;
		}
		if (nextProps.isFetching !== isFetching) {
			return true;
		}
		if (!equal(nextProps.users, users)) {
			return true;
		}
		return false;
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

		Review.pushPositiveEvent();
	}

	removeUser = (user) => {
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
				<StatusBar theme={theme} />
				<SafeAreaView testID='create-channel-view' style={styles.container} forceInset={{ vertical: 'never' }}>
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
	users: state.selectedUsers.users,
	user: getUserSelector(state)
});

const mapDispatchToProps = dispatch => ({
	create: data => dispatch(createChannelRequestAction(data)),
	removeUser: user => dispatch(removeUserAction(user))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(CreateChannelView));
