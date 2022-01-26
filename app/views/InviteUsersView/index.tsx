import React from 'react';
import { ScrollView, Share, View } from 'react-native';
import moment from 'moment';
import { connect } from 'react-redux';
import { StackNavigationProp, StackNavigationOptions } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/core';
import { Dispatch } from 'redux';

import { ChatsStackParamList } from '../../stacks/types';
import {
	inviteLinksClear as inviteLinksClearAction,
	inviteLinksCreate as inviteLinksCreateAction
} from '../../actions/inviteLinks';
import RCTextInput from '../../containers/TextInput';
import Markdown from '../../containers/markdown';
import Button from '../../containers/Button';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import { events, logEvent } from '../../utils/log';
import styles from './styles';

interface IInviteUsersViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'InviteUsersView'>;
	route: RouteProp<ChatsStackParamList, 'InviteUsersView'>;
	theme: string;
	timeDateFormat: string;
	invite: {
		url: string;
		expires: number;
		maxUses: number;
		uses: number;
	};
	createInviteLink(rid: string): void;
	clearInviteLink(): void;
}
class InviteUsersView extends React.Component<IInviteUsersViewProps, any> {
	private rid: string;

	static navigationOptions = (): StackNavigationOptions => ({
		title: I18n.t('Invite_users')
	});

	constructor(props: IInviteUsersViewProps) {
		super(props);
		this.rid = props.route.params?.rid;
	}

	componentDidMount() {
		const { createInviteLink } = this.props;
		createInviteLink(this.rid);
	}

	componentWillUnmount() {
		const { clearInviteLink } = this.props;
		clearInviteLink();
	}

	share = () => {
		logEvent(events.IU_SHARE);
		const { invite } = this.props;
		if (!invite || !invite.url) {
			return;
		}
		Share.share({ message: invite.url });
	};

	edit = () => {
		logEvent(events.IU_GO_IU_EDIT);
		const { navigation } = this.props;
		navigation.navigate('InviteUsersEditView', { rid: this.rid });
	};

	linkExpirationText = () => {
		const { timeDateFormat, invite } = this.props;

		if (!invite || !invite.url) {
			return null;
		}

		if (invite.expires) {
			const expiration = new Date(invite.expires);

			if (invite.maxUses) {
				const usesLeft = invite.maxUses - invite.uses;
				return I18n.t('Your_invite_link_will_expire_on__date__or_after__usesLeft__uses', {
					date: moment(expiration).format(timeDateFormat),
					usesLeft
				});
			}

			return I18n.t('Your_invite_link_will_expire_on__date__', { date: moment(expiration).format(timeDateFormat) });
		}

		if (invite.maxUses) {
			const usesLeft = invite.maxUses - invite.uses;
			return I18n.t('Your_invite_link_will_expire_after__usesLeft__uses', { usesLeft });
		}

		return I18n.t('Your_invite_link_will_never_expire');
	};

	renderExpiration = () => {
		const { theme } = this.props;
		const expirationMessage = this.linkExpirationText();
		// @ts-ignore
		return <Markdown msg={expirationMessage} username='' baseUrl='' theme={theme} />;
	};

	render() {
		const { theme, invite } = this.props;
		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }}>
				{/* @ts-ignore*/}
				<ScrollView
					{...scrollPersistTaps}
					style={{ backgroundColor: themes[theme].auxiliaryBackground }}
					showsVerticalScrollIndicator={false}>
					<StatusBar />
					<View style={styles.innerContainer}>
						<RCTextInput label={I18n.t('Invite_Link')} theme={theme} value={invite && invite.url} editable={false} />
						{this.renderExpiration()}
						<View style={[styles.divider, { backgroundColor: themes[theme].separatorColor }]} />
						<Button title={I18n.t('Share_Link')} type='primary' onPress={this.share} theme={theme} />
						<Button title={I18n.t('Edit_Invite')} type='secondary' onPress={this.edit} theme={theme} />
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: any) => ({
	timeDateFormat: state.settings.Message_TimeAndDateFormat,
	days: state.inviteLinks.days,
	maxUses: state.inviteLinks.maxUses,
	invite: state.inviteLinks.invite
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	createInviteLink: (rid: string) => dispatch(inviteLinksCreateAction(rid)),
	clearInviteLink: () => dispatch(inviteLinksClearAction())
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(InviteUsersView));
