import { useDispatch, useStore } from 'react-redux';

import { setUser } from '~/actions/login';
import { type IApplicationState, type ISidebarCategory } from '~/definitions';
import { useCaptureSession } from '~/lib/hooks/useCaptureSession';
import { saveSidebarCategories } from '~/lib/services/restApi';
import { getUserSelector } from '~/selectors/login';

type SessionSaves = {
	isSameSession: () => boolean;
	latestSaveId: number;
	pendingSaves: number;
	acceptedCategories?: ISidebarCategory[];
};

const sessionSavesByStore = new WeakMap<object, SessionSaves>();

export const useSaveSidebarCategories = () => {
	const dispatch = useDispatch();
	const store = useStore<IApplicationState>();
	const captureSession = useCaptureSession();
	const currentCategories = () => getUserSelector(store.getState()).sidebarCategories;

	const savesOfCurrentSession = () => {
		const saves = sessionSavesByStore.get(store);
		if (saves?.isSameSession()) {
			return saves;
		}
		const freshSaves: SessionSaves = { isSameSession: captureSession(), latestSaveId: 0, pendingSaves: 0 };
		sessionSavesByStore.set(store, freshSaves);
		return freshSaves;
	};

	return async (sidebarCategories: ISidebarCategory[], { ignoreSupersededFailure = false } = {}) => {
		const saves = savesOfCurrentSession();
		const isStale = () => saves !== sessionSavesByStore.get(store) || !saves.isSameSession();
		if (saves.pendingSaves === 0) {
			saves.acceptedCategories = currentCategories();
		}
		saves.pendingSaves += 1;
		saves.latestSaveId += 1;
		const saveId = saves.latestSaveId;
		dispatch(setUser({ sidebarCategories }));
		try {
			await saveSidebarCategories(sidebarCategories);
			saves.acceptedCategories = sidebarCategories;
		} catch (error) {
			if (isStale()) {
				return;
			}
			const isSuperseded = saveId !== saves.latestSaveId;
			if (!isSuperseded) {
				dispatch(setUser({ sidebarCategories: saves.acceptedCategories }));
			} else if (ignoreSupersededFailure) {
				return;
			}
			throw error;
		} finally {
			saves.pendingSaves -= 1;
		}
	};
};
