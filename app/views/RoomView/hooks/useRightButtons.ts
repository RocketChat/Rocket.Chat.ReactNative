import { useEffect, useState } from 'react';

import database from '../../../lib/database';
import { hasPermission } from '../../../lib/methods/helpers';
import { getUidDirectMessage } from '../../../lib/methods/helpers/helpers';
import { type TMessageModel, type TSubscriptionModel } from '../../../definitions';
import { type IUseRightButtonsParams, type IUseRightButtonsResult } from '../definitions';

export function useRightButtons({
	rid,
	tmid,
	userId,
	hasE2EEWarning,
	toggleRoomE2EEncryptionPermission
}: IUseRightButtonsParams): IUseRightButtonsResult {
	'use memo';

	const [isFollowingThread, setIsFollowingThread] = useState(true);
	const [tunread, setTunread] = useState<string[]>([]);
	const [tunreadUser, setTunreadUser] = useState<string[]>([]);
	const [tunreadGroup, setTunreadGroup] = useState<string[]>([]);
	const [isSelfDm, setIsSelfDm] = useState(false);
	const [canToggleEncryption, setCanToggleEncryption] = useState(false);
	const [subscription, setSubscription] = useState<TSubscriptionModel>();
	const [subscriptionVersion, setSubscriptionVersion] = useState(0);

	useEffect(() => {
		if (!tmid) {
			return;
		}
		let unsubscribe: (() => void) | undefined;
		database.active
			.get('messages')
			.find(tmid)
			.then((threadRecord: TMessageModel) => {
				const observable = threadRecord.observe();
				const subscriptionRef = observable.subscribe(thread => {
					setIsFollowingThread((thread.replies && !!thread.replies.find(replyUserId => replyUserId === userId)) ?? false);
				});
				unsubscribe = () => subscriptionRef.unsubscribe();
			})
			.catch(() => console.log("Can't find message to observe."));

		return () => unsubscribe?.();
	}, [tmid, userId]);

	useEffect(() => {
		if (!rid) {
			return;
		}
		let unsubscribe: (() => void) | undefined;
		database.active
			.get('subscriptions')
			.find(rid)
			.then((subRecord: TSubscriptionModel) => {
				setSubscription(subRecord);
				const observable = subRecord.observe();
				const subscriptionRef = observable.subscribe(sub => {
					setTunread(sub?.tunread ?? []);
					setTunreadUser(sub?.tunreadUser ?? []);
					setTunreadGroup(sub?.tunreadGroup ?? []);
					setIsSelfDm(sub?.t === 'd' && !!userId && getUidDirectMessage(sub) === userId);
					setSubscriptionVersion(version => version + 1);
				});
				unsubscribe = () => subscriptionRef.unsubscribe();
			})
			.catch(() => console.log("Can't find subscription to observe."));

		return () => unsubscribe?.();
	}, [rid, userId]);

	useEffect(() => {
		if (!hasE2EEWarning) {
			return;
		}
		let cancelled = false;
		hasPermission([toggleRoomE2EEncryptionPermission], rid).then(permissions => {
			if (!cancelled) {
				setCanToggleEncryption(permissions[0]);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [rid, hasE2EEWarning, toggleRoomE2EEncryptionPermission, subscriptionVersion]);

	return { isFollowingThread, tunread, tunreadUser, tunreadGroup, isSelfDm, canToggleEncryption, subscription };
}
