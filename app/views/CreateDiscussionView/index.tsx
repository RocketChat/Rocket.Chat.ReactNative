import React from 'react';
import { connect } from 'react-redux';
import { ScrollView, Switch, Text } from 'react-native';
import { StackNavigationOptions } from '@react-navigation/stack';

import { sendLoadingEvent } from '../../containers/Loading';
import KeyboardView from '../../containers/KeyboardView';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import I18n from '../../i18n';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import { FormTextInput } from '../../containers/TextInput';
import { createDiscussionRequest, ICreateDiscussionRequestData } from '../../actions/createDiscussion';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom } from '../../lib/methods/helpers/goRoom';
import { events, logEvent } from '../../lib/methods/helpers/log';
import styles from './styles';
import SelectUsers from './SelectUsers';
import SelectChannel from './SelectChannel';
import { ICreateChannelViewProps, IResult, IError, ICreateChannelViewState } from './interfaces';
import { IApplicationState, ISearchLocal, ISubscription } from '../../definitions';
import { E2E_ROOM_TYPES, SWITCH_TRACK_COLOR, themes } from '../../lib/constants';
import { getRoomTitle, showErrorAlert } from '../../lib/methods/helpers';

class CreateChannelView extends React.Component<ICreateChannelViewProps, ICreateChannelViewState> {
	private channel: ISubscription;

	constructor(props: ICreateChannelViewProps) {
		super(props);
		const { route } = props;
		this.channel = route.params?.channel;
		const message = route.params?.message ?? {};
		this.state = {
			channel: this.channel,
			message,
			name: message?.msg || '',
			users: [],
			reply: '',
			encrypted: props.encryptionEnabled
		};
		this.setHeader();
	}

	componentDidUpdate(prevProps: ICreateChannelViewProps, prevState: ICreateChannelViewState) {
		const { channel, name } = this.state;
		const { loading, failure, error, result, isMasterDetail } = this.props;

		if (channel?.rid !== prevState.channel?.rid || name !== prevState.name) {
			this.setHeader();
		}

		if (loading !== prevProps.loading) {
			sendLoadingEvent({ visible: loading });
			if (!loading) {
				if (failure) {
					const msg = error.reason || I18n.t('There_was_an_error_while_action', { action: I18n.t('creating_discussion') });
					showErrorAlert(msg);
				} else {
					const { rid, t, prid } = result;
					const item = {
						rid,
						name: getRoomTitle(result),
						t,
						prid
					};
					goRoom({ item, isMasterDetail, popToRoot: true });
				}
			}
		}
	}

	setHeader = () => {
		const { navigation, route } = this.props;
		const showCloseModal = route.params?.showCloseModal;
		navigation.setOptions({
			title: I18n.t('Create_Discussion'),
			headerRight: this.valid()
				? () => (
						<HeaderButton.Container>
							<HeaderButton.Item title={I18n.t('Create')} onPress={this.submit} testID='create-discussion-submit' />
						</HeaderButton.Container>
				  )
				: null,
			headerLeft: showCloseModal ? () => <HeaderButton.CloseModal navigation={navigation} /> : undefined
		} as StackNavigationOptions);
	};

	submit = () => {
		const {
			name: t_name,
			channel,
			message: { id: pmid },
			reply,
			users,
			encrypted
		} = this.state;
		const { dispatch } = this.props;

		const params: ICreateDiscussionRequestData = {
			prid: ('prid' in channel && channel.prid) || channel.rid,
			pmid,
			t_name,
			reply,
			users
		};
		if (this.isEncryptionEnabled) {
			params.encrypted = encrypted ?? false;
		}

		dispatch(createDiscussionRequest(params));
	};

	valid = () => {
		const { channel, name } = this.state;

		return channel && channel.rid && channel.rid.trim().length && name?.trim().length;
	};

	selectChannel = ({ value }: { value: ISearchLocal }) => {
		logEvent(events.CD_SELECT_CHANNEL);
		this.setState({ channel: value, encrypted: value?.encrypted });
	};

	selectUsers = ({ value }: { value: string[] }) => {
		logEvent(events.CD_SELECT_USERS);
		this.setState({ users: value });
	};

	get isEncryptionEnabled() {
		const { channel } = this.state;
		const { encryptionEnabled } = this.props;
		return encryptionEnabled && E2E_ROOM_TYPES[channel?.t];
	}

	onEncryptedChange = (value: boolean) => {
		logEvent(events.CD_TOGGLE_ENCRY);
		this.setState({ encrypted: value });
	};

	render() {
		const { name, users, encrypted } = this.state;
		const { server, user, blockUnauthenticatedAccess, theme, serverVersion } = this.props;
		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].auxiliaryBackground }}
				contentContainerStyle={styles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<SafeAreaView testID='create-discussion-view' style={styles.container}>
					<ScrollView {...scrollPersistTaps}>
						<Text style={[styles.description, { color: themes[theme].auxiliaryText }]}>{I18n.t('Discussion_Desc')}</Text>
						<SelectChannel
							server={server}
							userId={user.id}
							token={user.token}
							initial={this.channel && { text: getRoomTitle(this.channel) }}
							onChannelSelect={this.selectChannel}
							blockUnauthenticatedAccess={blockUnauthenticatedAccess}
							serverVersion={serverVersion}
						/>
						<FormTextInput
							label={I18n.t('Discussion_name')}
							testID='multi-select-discussion-name'
							placeholder={I18n.t('A_meaningful_name_for_the_discussion_room')}
							containerStyle={styles.inputStyle}
							defaultValue={name}
							onChangeText={(text: string) => this.setState({ name: text })}
						/>
						<SelectUsers
							server={server}
							userId={user.id}
							token={user.token}
							selected={users}
							onUserSelect={this.selectUsers}
							blockUnauthenticatedAccess={blockUnauthenticatedAccess}
							serverVersion={serverVersion}
						/>
						{this.isEncryptionEnabled ? (
							<>
								<Text style={[styles.label, { color: themes[theme].titleText }]}>{I18n.t('Encrypted')}</Text>
								<Switch value={encrypted} onValueChange={this.onEncryptedChange} trackColor={SWITCH_TRACK_COLOR} />
							</>
						) : null}
					</ScrollView>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	server: state.server.server,
	error: state.createDiscussion.error as IError,
	failure: state.createDiscussion.failure,
	loading: state.createDiscussion.isFetching,
	result: state.createDiscussion.result as IResult,
	blockUnauthenticatedAccess: !!state.settings.Accounts_AvatarBlockUnauthenticatedAccess ?? true,
	serverVersion: state.server.version as string,
	isMasterDetail: state.app.isMasterDetail,
	encryptionEnabled: state.encryption.enabled
});

export default connect(mapStateToProps)(withTheme(CreateChannelView));
