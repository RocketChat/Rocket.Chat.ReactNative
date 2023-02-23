import React, { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import { useActionSheet } from '../../containers/ActionSheet';
import StartACallActionSheet from '../../containers/UIKit/VideoConferenceBlock/components/StartACallActionSheet';
import { ISubscription, SubscriptionType, TSubscriptionModel } from '../../definitions';
import i18n from '../../i18n';
import { getUserSelector } from '../../selectors/login';
import database from '../database';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { callJitsi } from '../methods';
import { compareServerVersion, showErrorAlert } from '../methods/helpers';
import { videoConfStartAndJoin } from '../methods/videoConf';
import { Services } from '../services';
import { useAppSelector } from './useAppSelector';
import { useSnaps } from './useSnaps';

const availabilityErrors = {
	NOT_CONFIGURED: 'video-conf-provider-not-configured',
	NOT_ACTIVE: 'no-active-video-conf-provider',
	NO_APP: 'no-videoconf-provider-app'
} as const;

const handleErrors = (isAdmin: boolean, error: typeof availabilityErrors[keyof typeof availabilityErrors]) => {
	if (isAdmin) return showErrorAlert(i18n.t(`admin-${error}-body`), i18n.t(`admin-${error}-header`));
	return showErrorAlert(i18n.t(`${error}-body`), i18n.t(`${error}-header`));
};

export const useVideoConf = (rid: string): { showInitCallActionSheet: () => Promise<void>; showCallOption: boolean } => {
	const [showCallOption, setShowCallOption] = useState(false);

	const serverVersion = useAppSelector(state => state.server.version);
	const jitsiEnabled = useAppSelector(state => state.settings.Jitsi_Enabled);
	const jitsiEnableTeams = useAppSelector(state => state.settings.Jitsi_Enable_Teams);
	const jitsiEnableChannels = useAppSelector(state => state.settings.Jitsi_Enable_Channels);
	const user = useAppSelector(state => getUserSelector(state));

	const isServer5OrNewer = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '5.0.0');

	const { showActionSheet } = useActionSheet();
	const snaps = useSnaps([1250]);

	const handleShowCallOption = (room: TSubscriptionModel) => {
		if (isServer5OrNewer) return setShowCallOption(true);
		const isJitsiDisabledForTeams = room.teamMain && !jitsiEnableTeams;
		const isJitsiDisabledForChannels = !room.teamMain && (room.t === 'p' || room.t === 'c') && !jitsiEnableChannels;

		if (room.t === SubscriptionType.DIRECT) return setShowCallOption(!!jitsiEnabled);
		if (room.t === SubscriptionType.CHANNEL) return setShowCallOption(!isJitsiDisabledForChannels);
		if (room.t === SubscriptionType.GROUP) return setShowCallOption(!isJitsiDisabledForTeams);

		return setShowCallOption(false);
	};

	const canInitAnCall = async () => {
		if (isServer5OrNewer) {
			try {
				await Services.videoConferenceGetCapabilities();
				return true;
			} catch (error: any) {
				const isAdmin = !!['admin'].find(role => user.roles?.includes(role));
				switch (error?.error) {
					case availabilityErrors.NOT_CONFIGURED:
						return handleErrors(isAdmin, availabilityErrors.NOT_CONFIGURED);
					case availabilityErrors.NOT_ACTIVE:
						return handleErrors(isAdmin, availabilityErrors.NOT_ACTIVE);
					case availabilityErrors.NO_APP:
						return handleErrors(isAdmin, availabilityErrors.NO_APP);
					default:
						return handleErrors(isAdmin, availabilityErrors.NOT_CONFIGURED);
				}
			}
		}
		return true;
	};

	const initCall = async ({ cam, mic }: { cam: boolean; mic: boolean }) => {
		if (isServer5OrNewer) return videoConfStartAndJoin({ rid, cam, mic });
		const room = (await getSubscriptionByRoomId(rid)) as ISubscription;
		callJitsi({ room, cam });
	};

	const showInitCallActionSheet = async () => {
		const canInit = await canInitAnCall();
		if (canInit) {
			showActionSheet({
				children: <StartACallActionSheet rid={rid} initCall={initCall} />,
				snaps
			});
		}
	};

	const initSubscription = () => {
		try {
			const db = database.active;
			const observeSubCollection = db.get('subscriptions').query(Q.where('rid', rid)).observe();
			const subObserveQuery = observeSubCollection.subscribe(data => {
				if (data[0]) {
					handleShowCallOption(data[0]);
					subObserveQuery.unsubscribe();
				}
			});
		} catch (e) {
			console.log("observeSubscriptions: Can't find subscription to observe");
		}
	};

	useEffect(() => {
		initSubscription();
	}, []);

	return { showInitCallActionSheet, showCallOption };
};
