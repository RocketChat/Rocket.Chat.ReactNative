import { useEffect, useState, memo } from 'react';
import { Grid } from 'react-native-easy-grid';

import { resetAttempts } from '../../../lib/methods/helpers/localAuthentication';
import { TYPE } from '../constants';
import { getDiff, getLockedUntil } from '../utils';
import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import styles from './styles';
import Title from './Title';
import Subtitle from './Subtitle';
import LockIcon from './LockIcon';

interface IPasscodeTimer {
	time: Date | null;
	setStatus: Function;
}

interface IPasscodeLocked {
	setStatus: Function;
}

const Timer = memo(({ time, setStatus }: IPasscodeTimer) => {
	const calcTimeLeft = () => {
		const diff = getDiff(time || 0);
		if (diff > 0) {
			return Math.floor((diff / 1000) % 60);
		}
	};

	const [timeLeft, setTimeLeft] = useState(calcTimeLeft());

	useEffect(() => {
		const unlock = async () => {
			try {
				// Await the storage clear before flipping status: PasscodeEnter's readStorage re-seeds
				// the attempts counter from ATTEMPTS_KEY on the status change, so the key must already
				// be gone or the user would re-lock after a single wrong attempt.
				await resetAttempts();
			} catch (e) {
				console.warn('[Passcode/Locked] Failed to reset attempts after lock expiration:', e);
			} finally {
				setStatus(TYPE.ENTER);
			}
		};

		if (!time) {
			setTimeLeft(undefined);
			return;
		}

		const syncTimeLeft = () => {
			const nextTimeLeft = calcTimeLeft();
			setTimeLeft(nextTimeLeft);

			if (nextTimeLeft !== undefined) {
				return false;
			}

			unlock().catch(e => {
				console.warn('[Passcode/Locked] Unexpected unlock failure:', e);
			});
			return true;
		};

		if (syncTimeLeft()) {
			return;
		}

		const intervalId = setInterval(() => {
			if (syncTimeLeft()) {
				clearInterval(intervalId);
			}
		}, 1000);

		return () => clearInterval(intervalId);
	}, [time, setStatus]);

	if (!timeLeft) {
		return null;
	}

	return <Subtitle text={I18n.t('Passcode_app_locked_subtitle', { timeLeft })} />;
});

const Locked = memo(({ setStatus }: IPasscodeLocked) => {
	const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
	const { colors } = useTheme();

	const readItemFromStorage = async () => {
		const l = await getLockedUntil();
		setLockedUntil(l);
	};

	useEffect(() => {
		readItemFromStorage();
	}, []);

	return (
		<Grid style={[styles.grid, { backgroundColor: colors.strokeExtraLight }]}>
			<LockIcon />
			<Title text={I18n.t('Passcode_app_locked_title')} />
			<Timer time={lockedUntil} setStatus={setStatus} />
		</Grid>
	);
});

export default Locked;
