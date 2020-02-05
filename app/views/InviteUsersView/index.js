import React from 'react';
import PropTypes from 'prop-types';
import { View, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import moment from 'moment';
import { connect } from 'react-redux';

import {
	inviteLinksCreate as inviteLinksCreateAction,
	inviteLinksClear as inviteLinksClearAction
} from '../../actions/inviteLinks';
import RCTextInput from '../../containers/TextInput';
import styles from './styles';
import Markdown from '../../containers/markdown';
import Button from '../../containers/Button';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';

class InviteUsersView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Invite_users'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string,
		timeDateFormat: PropTypes.string,
		invite: PropTypes.object,
		createInviteLink: PropTypes.func,
		clearInviteLink: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.rid = props.navigation.getParam('rid');
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
		const { invite } = this.props;
		if (!invite || !invite.url) {
			return;
		}
		Share.share({ message: invite.url });
	}

	edit = () => {
		const { navigation } = this.props;
		navigation.navigate('InviteUsersEditView', { rid: this.rid });
	}

	linkExpirationText = () => {
		const { timeDateFormat, invite } = this.props;

		if (!invite || !invite.url) {
			return null;
		}

		if (invite.expires) {
			const expiration = new Date(invite.expires);

			if (invite.maxUses) {
				const usesLeft = invite.maxUses - invite.uses;
				return I18n.t('Your_invite_link_will_expire_on__date__or_after__usesLeft__uses', { date: moment(expiration).format(timeDateFormat), usesLeft });
			}

			return I18n.t('Your_invite_link_will_expire_on__date__', { date: moment(expiration).format(timeDateFormat) });
		}

		if (invite.maxUses) {
			const usesLeft = invite.maxUses - invite.uses;
			return I18n.t('Your_invite_link_will_expire_after__usesLeft__uses', { usesLeft });
		}

		return I18n.t('Your_invite_link_will_never_expire');
	}

	renderExpiration = () => {
		const { theme } = this.props;
		const expirationMessage = this.linkExpirationText();
		return <Markdown msg={expirationMessage} username='' baseUrl='' theme={theme} />;
	}

	render() {
		const {
			theme, invite
		} = this.props;
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]} forceInset={{ vertical: 'never' }}>
				<ScrollView
					{...scrollPersistTaps}
					style={{ backgroundColor: themes[theme].auxiliaryBackground }}
					contentContainerStyle={styles.contentContainer}
					showsVerticalScrollIndicator={false}
				>
					<StatusBar theme={theme} />
					<View style={styles.innerContainer}>
						<RCTextInput
							label={I18n.t('Invite_Link')}
							theme={theme}
							value={invite && invite.url}
							editable={false}
						/>
						{this.renderExpiration()}
						<View style={[styles.divider, { backgroundColor: themes[theme].separatorColor }]} />
						<Button
							title={I18n.t('Share_Link')}
							type='primary'
							onPress={this.share}
							theme={theme}
						/>
						<Button
							title={I18n.t('Edit_Invite')}
							type='secondary'
							onPress={this.edit}
							theme={theme}
						/>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	timeDateFormat: state.settings.Message_TimeAndDateFormat,
	days: state.inviteLinks.days,
	maxUses: state.inviteLinks.maxUses,
	invite: state.inviteLinks.invite
});

const mapDispatchToProps = dispatch => ({
	createInviteLink: rid => dispatch(inviteLinksCreateAction(rid)),
	clearInviteLink: () => dispatch(inviteLinksClearAction())
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(InviteUsersView));
