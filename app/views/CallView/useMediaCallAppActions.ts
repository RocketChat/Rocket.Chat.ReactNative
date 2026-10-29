import { useEffect } from 'react';
import { create } from 'zustand';

import { useCallStore } from '~/lib/services/voip/useCallStore';
import {
	fetchMediaCallAppActions,
	triggerMediaCallAppAction,
	type MediaCallAppAction,
	type MediaCallAppActionUpdate,
	type MediaCallWidgetState
} from '~/lib/services/voip/mediaCallAppActions';
import log from '~/lib/methods/helpers/log';

const actionKey = ({ appId, actionId }: Pick<MediaCallAppAction, 'appId' | 'actionId'>) => `${appId}-${actionId}`;

interface MediaCallAppActionsStore {
	callId: string | null;
	actions: MediaCallAppAction[];
	overrides: Record<string, MediaCallAppActionUpdate>;
	setOverride: (key: string, update: MediaCallAppActionUpdate) => void;
}

export const useMediaCallAppActionsStore = create<MediaCallAppActionsStore>(set => ({
	callId: null,
	actions: [],
	overrides: {},
	setOverride: (key, update) =>
		set(state => ({ overrides: { ...state.overrides, [key]: { ...state.overrides[key], ...update } } }))
}));

export type VisibleMediaCallAppAction = MediaCallAppAction & { key: string; onPress: () => Promise<void> };

const toWidgetState = (
	callState: ReturnType<typeof useCallStore.getState>['callState'],
	direction: 'incoming' | 'outgoing' | null
): MediaCallWidgetState | null => {
	if (callState === 'active' || callState === 'renegotiating') {
		return 'ongoing';
	}
	if (callState === 'hangup') {
		return null;
	}
	return direction === 'outgoing' ? 'calling' : 'ringing';
};

export const useMediaCallAppActions = (): VisibleMediaCallAppAction[] => {
	const callId = useCallStore(state => state.callId);
	const callState = useCallStore(state => state.callState);
	const direction = useCallStore(state => state.direction);
	const actions = useMediaCallAppActionsStore(state => state.actions);
	const overrides = useMediaCallAppActionsStore(state => state.overrides);

	useEffect(() => {
		if (!callId || useMediaCallAppActionsStore.getState().callId === callId) {
			return;
		}
		useMediaCallAppActionsStore.setState({ callId, actions: [], overrides: {} });
		fetchMediaCallAppActions()
			.then(fetched => {
				if (useMediaCallAppActionsStore.getState().callId === callId) {
					useMediaCallAppActionsStore.setState({ actions: fetched });
				}
			})
			.catch(e => log(e));
	}, [callId]);

	const widgetState = toWidgetState(callState, direction);
	if (!callId || !widgetState) {
		return [];
	}

	return actions
		.filter(({ callStates }) => !callStates || callStates.includes(widgetState))
		.map(action => {
			const key = actionKey(action);
			const merged = { ...action, ...overrides[key] };
			const onPress = async () => {
				const { setOverride } = useMediaCallAppActionsStore.getState();
				setOverride(key, { disabled: true });
				const update = await triggerMediaCallAppAction({
					appId: merged.appId,
					actionId: merged.actionId,
					callId,
					rid: useCallStore.getState().roomId ?? undefined
				}).catch(e => {
					log(e);
					return undefined;
				});
				setOverride(key, { ...update, disabled: update?.disabled ?? false });
			};
			return { ...merged, key, onPress };
		});
};
