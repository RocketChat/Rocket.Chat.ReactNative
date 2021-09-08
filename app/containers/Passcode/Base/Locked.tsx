import React, { useEffect, useState } from 'react';
import { Grid } from 'react-native-easy-grid';

import { themes } from '../../../constants/colors';
import { resetAttempts } from '../../../utils/localAuthentication';
import { TYPE } from '../constants';
import { getDiff, getLockedUntil } from '../utils';
import I18n from '../../../i18n';
import styles from './styles';
import Title from './Title';
import Subtitle from './Subtitle';
import LockIcon from './LockIcon';

interface IPasscodeTimer {
	time: string;
	theme: string;
	setStatus: Function;
}

interface IPasscodeLocked {
	theme: string;
	setStatus: Function;
}

const Timer = React.memo(({ time, theme, setStatus }: IPasscodeTimer) => {
	const calcTimeLeft = () => {
		const diff = getDiff(time);
		if (diff > 0) {
			return Math.floor((diff / 1000) % 60);
		}
	};

	const [timeLeft, setTimeLeft] = useState<any>(calcTimeLeft());

	useEffect(() => {
		setTimeout(() => {
			setTimeLeft(calcTimeLeft());
			if (timeLeft <= 1) {
				resetAttempts();
				setStatus(TYPE.ENTER);
			}
		}, 1000);
	});

	if (!timeLeft) {
		return null;
	}

	return <Subtitle text={I18n.t('Passcode_app_locked_subtitle', { timeLeft })} theme={theme} />;
});

const Locked = React.memo(({ theme, setStatus }: IPasscodeLocked) => {
	const [lockedUntil, setLockedUntil] = useState<any>(null);

	const readItemFromStorage = async () => {
		const l = await getLockedUntil();
		setLockedUntil(l);
	};

	useEffect(() => {
		readItemFromStorage();
	}, []);

	return (
		<Grid style={[styles.grid, { backgroundColor: themes[theme].passcodeBackground }]}>
			<LockIcon theme={theme} />
			<Title text={I18n.t('Passcode_app_locked_title')} theme={theme} />
			<Timer theme={theme} time={lockedUntil} setStatus={setStatus} />
		</Grid>
	);
});

export default Locked;
