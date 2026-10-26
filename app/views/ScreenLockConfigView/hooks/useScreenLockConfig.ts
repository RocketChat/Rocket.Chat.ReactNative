import { useEffect, useRef, useState } from 'react';

import I18n from '~/i18n';
import database from '~/lib/database';
import {
	changePasscode as changeStoredPasscode,
	checkHasPasscode,
	enableBiometry,
	handleLocalAuthentication,
	logUnlessUserCanceled,
	supportedBiometryLabel
} from '~/lib/methods/helpers/localAuthentication';
import { DEFAULT_AUTO_LOCK } from '~/lib/constants/localAuthentication';
import { biometricTrustStore } from '~/lib/biometricTrustStore';
import { events, logEvent } from '~/lib/methods/helpers/log';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { type TServerModel } from '~/definitions';

export interface IAutoLockOption {
	title: string;
	value: number;
	disabled?: boolean;
}

const DEFAULT_AUTO_LOCK_TIMES = [60, 300, 900, 1800, 3600];

const adminAutoLockOption = (seconds: number, disabled?: boolean): IAutoLockOption => ({
	title: I18n.t('After_seconds_set_by_admin', { seconds }),
	value: seconds,
	disabled
});

const getAutoLockOptions = ({
	autoLockTime,
	forceScreenLock,
	forceScreenLockAfter
}: {
	autoLockTime: number | null;
	forceScreenLock: boolean;
	forceScreenLockAfter: number;
}): IAutoLockOption[] => {
	if (forceScreenLock && forceScreenLockAfter > 0) {
		return [adminAutoLockOption(forceScreenLockAfter, true)];
	}
	const options = DEFAULT_AUTO_LOCK_TIMES.map(value => ({
		title: I18n.t(`Local_authentication_auto_lock_${value}`),
		value
	}));
	if (forceScreenLockAfter === autoLockTime && !DEFAULT_AUTO_LOCK_TIMES.includes(autoLockTime)) {
		options.push(adminAutoLockOption(forceScreenLockAfter));
	}
	return options;
};

const showBiometryEnableError = (kind: string) => {
	if (kind === 'unavailable') {
		showErrorAlert(I18n.t('Local_authentication_biometry_unavailable'), I18n.t('Oops'));
	} else if (kind !== 'canceled') {
		showErrorAlert(I18n.t('Local_authentication_biometry_enable_failed'), I18n.t('Oops'));
	}
};

export const useScreenLockConfig = () => {
	const server = useAppSelector(state => state.server.server);
	const forceScreenLock = useAppSelector(state => state.settings.Force_Screen_Lock as boolean);
	const forceScreenLockAfter = useAppSelector(state => state.settings.Force_Screen_Lock_After as number);

	const serverRecord = useRef<TServerModel | undefined>(undefined);
	const latestAutoLock = useRef(false);

	const [autoLock, setAutoLock] = useState(false);
	const [autoLockTime, setAutoLockTime] = useState<number | null>(null);
	const [biometry, setBiometry] = useState(false);
	const [biometryLabel, setBiometryLabel] = useState<string | null>(null);
	const [biometryBusy, setBiometryBusy] = useState(false);

	useEffect(() => {
		const load = async () => {
			const record = await database.servers
				.get('servers')
				.find(server)
				.catch(() => undefined);
			if (record) {
				serverRecord.current = record;
				latestAutoLock.current = record.autoLock;
				setAutoLock(record.autoLock);
				setAutoLockTime(record.autoLockTime === null ? DEFAULT_AUTO_LOCK : (record.autoLockTime ?? null));
				setBiometry(biometricTrustStore.isEnabled());
			}
			setBiometryLabel(await supportedBiometryLabel());
		};
		load();
	}, [server]);

	const save = async (nextAutoLock: boolean, nextAutoLockTime: number | null) => {
		logEvent(events.SLC_SAVE_SCREEN_LOCK);
		await database.servers.write(async () => {
			await serverRecord.current?.update(record => {
				record.autoLock = nextAutoLock;
				record.autoLockTime = nextAutoLockTime === null ? DEFAULT_AUTO_LOCK : nextAutoLockTime;
			});
		});
	};

	const applyAutoLock = (nextAutoLock: boolean) => {
		latestAutoLock.current = nextAutoLock;
		setAutoLock(nextAutoLock);
		setAutoLockTime(DEFAULT_AUTO_LOCK);
		logEvent(events.SLC_TOGGLE_AUTOLOCK);
	};

	const toggleAutoLock = async (value?: boolean) => {
		if (forceScreenLock) {
			return;
		}
		const nextAutoLock = typeof value === 'boolean' ? value : !autoLock;
		if (latestAutoLock.current === nextAutoLock) {
			return;
		}
		applyAutoLock(nextAutoLock);
		if (nextAutoLock) {
			try {
				await checkHasPasscode({ force: false });
				setBiometry(biometricTrustStore.isEnabled());
			} catch {
				applyAutoLock(false);
				await save(false, DEFAULT_AUTO_LOCK);
				return;
			}
		}
		await save(nextAutoLock, DEFAULT_AUTO_LOCK);
	};

	const toggleBiometry = async () => {
		if (biometryBusy) {
			return;
		}
		logEvent(events.SLC_TOGGLE_BIOMETRY);
		const nextBiometry = !biometry;
		setBiometry(nextBiometry);
		setBiometryBusy(true);
		if (!nextBiometry) {
			await biometricTrustStore.disableBiometry();
			setBiometryBusy(false);
			return;
		}
		const result = await enableBiometry();
		if (result.kind !== 'success') {
			setBiometry(false);
			showBiometryEnableError(result.kind);
		}
		setBiometryBusy(false);
	};

	const changeAutoLockTime = (nextAutoLockTime: number) => {
		logEvent(events.SLC_CHANGE_AUTOLOCK_TIME);
		setAutoLockTime(nextAutoLockTime);
		save(autoLock, nextAutoLockTime);
	};

	const changePasscode = async () => {
		if (autoLock) {
			try {
				await handleLocalAuthentication({ canCloseModal: true });
			} catch (e) {
				logUnlessUserCanceled(e);
				return;
			}
		}
		logEvent(events.SLC_CHANGE_PASSCODE);
		try {
			await changeStoredPasscode({ force: false });
		} catch (e) {
			logUnlessUserCanceled(e);
		}
	};

	return {
		autoLock,
		autoLockTime,
		autoLockOptions: autoLock
			? getAutoLockOptions({
					autoLockTime,
					forceScreenLock,
					forceScreenLockAfter
				})
			: [],
		biometry,
		biometryLabel,
		biometryBusy,
		forceScreenLock,
		toggleAutoLock,
		toggleBiometry,
		changeAutoLockTime,
		changePasscode
	};
};
