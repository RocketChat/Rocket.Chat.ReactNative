import React, { useEffect } from 'react';
import moment from 'moment';
import { ScrollView, Share, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { inviteLinksClear, inviteLinksCreate } from '../../actions/inviteLinks';
import Button from '../../containers/Button';
import Markdown from '../../containers/markdown';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { FormTextInput } from '../../containers/TextInput';
import { IApplicationState, IBaseScreen } from '../../definitions';
import I18n from '../../i18n';
import { ChatsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import { events, logEvent } from '../../lib/methods/helpers/log';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import styles from './styles';

type IInviteUsersViewProps = IBaseScreen<ChatsStackParamList, 'InviteUsersView'>;

const InviteUsersView = ({ route, navigation }: IInviteUsersViewProps): React.ReactElement => {
	const rid = route.params?.rid;
	const timeDateFormat = useSelector((state: IApplicationState) => state.settings.Message_TimeAndDateFormat as string);
	const invite = useSelector((state: IApplicationState) => state.inviteLinks.invite);
	const { colors } = useTheme();
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
		return <Markdown msg={expirationMessage} />;
	};

	return (
		<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }}>
			<ScrollView {...scrollPersistTaps} style={{ backgroundColor: colors.surfaceHover }} showsVerticalScrollIndicator={false}>
				<StatusBar />
				<View style={styles.innerContainer}>
					<FormTextInput label={I18n.t('Invite_Link')} value={invite && invite.url} editable={false} />
					{renderExpiration()}
					<View style={[styles.divider, { backgroundColor: colors.strokeLight }]} />
					<Button title={I18n.t('Share_Link')} type='primary' onPress={share} />
					<Button title={I18n.t('Edit_Invite')} type='secondary' onPress={edit} />
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default InviteUsersView;
