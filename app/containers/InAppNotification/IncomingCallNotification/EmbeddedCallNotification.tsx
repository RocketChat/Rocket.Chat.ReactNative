import { type ReactElement, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { removeVideoConfCall } from '~/actions/videoConf';
import AvatarContainer from '~/containers/Avatar';
import i18n from '~/i18n';
import { useConferenceInfo } from '~/lib/hooks/useConferenceInfo';
import log from '~/lib/methods/helpers/log';
import { hideNotification } from '~/lib/methods/helpers/notifications';
import { videoConfJoin } from '~/lib/methods/videoConf';
import { videoConferenceDecline } from '~/lib/services/restApi';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import IncomingCallShell from './IncomingCallShell';

interface IEmbeddedCallNotification {
	notification: { callId: string; rid: string; uid: string };
}

const styles = StyleSheet.create({
	title: {
		...sharedStyles.textBold,
		fontSize: 14
	},
	caller: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingTop: 8
	},
	name: {
		...sharedStyles.textBold,
		flexShrink: 1,
		fontSize: 16
	}
});

const EmbeddedCallNotification = ({ notification: { callId, rid, uid } }: IEmbeddedCallNotification): ReactElement | null => {
	const { colors } = useTheme();
	const dispatch = useDispatch();
	const { info } = useConferenceInfo(callId);
	const isRingable = !!info && !info.endedAt && !!info.capabilities?.embedded;

	useEffect(
		() => () => {
			dispatch(removeVideoConfCall({ callId, rid, uid }));
		},
		[dispatch, callId, rid, uid]
	);

	useEffect(() => {
		if (info && !isRingable) {
			hideNotification();
		}
	}, [info, isRingable]);

	if (!info || !isRingable) {
		return null;
	}

	const callerName = info.createdBy.name || info.createdBy.username;
	const name = 'title' in info && info.title ? info.title : callerName;

	return (
		<IncomingCallShell
			testIDPrefix='embedded-call'
			accessibilityLabel={`${i18n.t('Incoming_call_from')} ${name}`}
			header={
				<>
					<Text style={[styles.title, { color: colors.fontDefault }]}>{i18n.t('Incoming_call_from')}</Text>
					<View style={styles.caller}>
						<AvatarContainer text={info.createdBy.username} size={36} />
						<Text style={[styles.name, { color: colors.fontDefault }]} numberOfLines={1}>
							{name}
						</Text>
					</View>
				</>
			}
			onDecline={() => videoConferenceDecline(callId).catch(log)}
			onAccept={() => videoConfJoin(callId, undefined, undefined, { rid })}
		/>
	);
};

export default EmbeddedCallNotification;
