import React, { useEffect, useState } from 'react';
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

const Timer = React.memo(({ time, setStatus }: IPasscodeTimer) => {
	const calcTimeLeft = () => {
		const diff = getDiff(time || 0);
		if (diff > 0) {
			return Math.floor((diff / 1000) % 60);
		}
	};

	const [timeLeft, setTimeLeft] = useState(calcTimeLeft());

	useEffect(() => {
		setTimeout(() => {
			setTimeLeft(calcTimeLeft());
			if (timeLeft && timeLeft <= 1) {
				resetAttempts();
				setStatus(TYPE.ENTER);
			}
		}, 1000);
	});

	if (!timeLeft) {
		return null;
	}

	return <Subtitle text={I18n.t('Passcode_app_locked_subtitle', { timeLeft })} />;
});

const Locked = React.memo(({ setStatus }: IPasscodeLocked) => {
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
