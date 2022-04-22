import React, { useEffect } from 'react';
import moment from 'moment';
import { ScrollView, Share, View } from 'react-native';
import { connect, useDispatch } from 'react-redux';

import { inviteLinksClear, inviteLinksCreate } from '../../actions/inviteLinks';
import { themes } from '../../lib/constants';
import Button from '../../containers/Button';
import Markdown from '../../containers/markdown';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import RCTextInput from '../../containers/TextInput';
import { IApplicationState, IBaseScreen } from '../../definitions';
import I18n from '../../i18n';
import { TInvite } from '../../reducers/inviteLinks';
import { ChatsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import { events, logEvent } from '../../utils/log';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import styles from './styles';

interface IInviteUsersViewProps extends IBaseScreen<ChatsStackParamList, 'InviteUsersView'> {
	timeDateFormat: string;
	invite: TInvite;
}
const InviteUsersView = ({ timeDateFormat, invite, route, navigation }: IInviteUsersViewProps) => {
	const rid = route.params?.rid;
	const { theme } = useTheme();
	const dispatch = useDispatch();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Invite_users')
		});
	}, []);

	useEffect(() => {
		dispatch(inviteLinksCreate(rid));
		return () => {
			dispatch(inviteLinksClear());
		};
	}, []);

	const share = () => {
		logEvent(events.IU_SHARE);
		if (!invite || !invite.url) {
			return;
		}
		Share.share({ message: invite.url });
	};

	const edit = () => {
		logEvent(events.IU_GO_IU_EDIT);
		navigation.navigate('InviteUsersEditView', { rid });
	};

	const linkExpirationText = () => {
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

	const renderExpiration = () => {
		const expirationMessage = linkExpirationText();
		return <Markdown msg={expirationMessage} theme={theme} />;
	};

	return (
		<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }}>
			<ScrollView
				{...scrollPersistTaps}
				style={{ backgroundColor: themes[theme].auxiliaryBackground }}
				showsVerticalScrollIndicator={false}>
				<StatusBar />
				<View style={styles.innerContainer}>
					<RCTextInput label={I18n.t('Invite_Link')} theme={theme} value={invite && invite.url} editable={false} />
					{renderExpiration()}
					<View style={[styles.divider, { backgroundColor: themes[theme].separatorColor }]} />
					<Button title={I18n.t('Share_Link')} type='primary' onPress={share} theme={theme} />
					<Button title={I18n.t('Edit_Invite')} type='secondary' onPress={edit} theme={theme} />
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const mapStateToProps = (state: IApplicationState) => ({
	timeDateFormat: state.settings.Message_TimeAndDateFormat as string,
	invite: state.inviteLinks.invite
});

export default connect(mapStateToProps)(InviteUsersView);
