import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import isEqual from 'lodash/isEqual';

import Loading from '../../containers/Loading';
import KeyboardView from '../../presentation/KeyboardView';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import { CustomHeaderButtons, Item, CloseModalButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import { getUserSelector } from '../../selectors/login';
import TextInput from '../../containers/TextInput';
import RocketChat from '../../lib/rocketchat';
import Navigation from '../../lib/Navigation';
import { createDiscussionRequest } from '../../actions/createDiscussion';
import { showErrorAlert } from '../../utils/info';

import SelectChannel from './SelectChannel';
import SelectUsers from './SelectUsers';

import styles from './styles';

class CreateChannelView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const submit = navigation.getParam('submit', () => {});
		const showSubmit = navigation.getParam('showSubmit', navigation.getParam('message'));
		return {
			...themedHeader(screenProps.theme),
			title: I18n.t('Create_Discussion'),
			headerRight: (
				showSubmit
					? (
						<CustomHeaderButtons>
							<Item title={I18n.t('Create')} onPress={submit} testID='create-discussion-submit' />
						</CustomHeaderButtons>
					)
					: null
			),
			headerLeft: <CloseModalButton navigation={navigation} />
		};
	}

	propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		user: PropTypes.object,
		create: PropTypes.func,
		loading: PropTypes.bool,
		result: PropTypes.object,
		failure: PropTypes.bool,
		error: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		const { navigation } = props;
		navigation.setParams({ submit: this.submit });
		this.channel = navigation.getParam('channel');
		const message = navigation.getParam('message', {});
		this.state = {
			channel: this.channel,
			message,
			name: message.msg || '',
			users: [],
			reply: ''
		};
	}

	componentDidUpdate(prevProps, prevState) {
		const {
			loading, failure, error, result, navigation
		} = this.props;

		if (!isEqual(this.state, prevState)) {
			navigation.setParams({ showSubmit: this.valid() });
		}

		if (!loading && loading !== prevProps.loading) {
			setTimeout(() => {
				if (failure) {
					const msg = error.reason || I18n.t('There_was_an_error_while_action', { action: I18n.t('creating_channel') });
					showErrorAlert(msg);
				} else {
					const { rid, t, prid } = result;
					if (this.channel) {
						Navigation.navigate('RoomsListView');
					}
					Navigation.navigate('RoomView', {
						rid, name: RocketChat.getRoomTitle(result), t, prid
					});
				}
			}, 300);
		}
	}

	submit = () => {
		const {
			name: t_name, channel: { prid, rid }, message: { id: pmid }, reply, users
		} = this.state;
		const { create } = this.props;

		// create discussion
		create({
			prid: prid || rid, pmid, t_name, reply, users
		});
	};

	valid = () => {
		const {
			channel, name
		} = this.state;

		return (
			channel
			&& channel.rid
			&& channel.rid.trim().length
			&& name.trim().length
		);
	};

	render() {
		const { name, users } = this.state;
		const {
			server, user, loading, theme
		} = this.props;
		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].auxiliaryBackground }}
				contentContainerStyle={styles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar theme={theme} />
				<SafeAreaView testID='create-discussion-view' style={styles.container} forceInset={{ vertical: 'never' }}>
					<ScrollView {...scrollPersistTaps}>
						<Text style={[styles.description, { color: themes[theme].auxiliaryText }]}>{I18n.t('Discussion_Desc')}</Text>
						<SelectChannel
							server={server}
							userId={user.id}
							token={user.token}
							initial={this.channel && { text: RocketChat.getRoomTitle(this.channel) }}
							onChannelSelect={({ value }) => this.setState({ channel: { rid: value } })}
							theme={theme}
						/>
						<TextInput
							label={I18n.t('Discussion_name')}
							placeholder={I18n.t('A_meaningful_name_for_the_discussion_room')}
							containerStyle={styles.inputStyle}
							defaultValue={name}
							onChangeText={text => this.setState({ name: text })}
							theme={theme}
						/>
						<SelectUsers
							server={server}
							userId={user.id}
							token={user.token}
							selected={users}
							onUserSelect={({ value }) => this.setState({ users: value })}
							theme={theme}
						/>
						<TextInput
							multiline
							textAlignVertical='top'
							label={I18n.t('Your_message')}
							inputStyle={styles.multiline}
							theme={theme}
							placeholder={I18n.t('Usually_a_discussion_starts_with_a_question_like_How_do_I_upload_a_picture')}
							onChangeText={text => this.setState({ reply: text })}
						/>
						<Loading visible={loading} />
					</ScrollView>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	server: state.server.server,
	error: state.createDiscussion.error,
	failure: state.createDiscussion.failure,
	loading: state.createDiscussion.isFetching,
	result: state.createDiscussion.result
});

const mapDispatchToProps = dispatch => ({
	create: data => dispatch(createDiscussionRequest(data))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(CreateChannelView));
