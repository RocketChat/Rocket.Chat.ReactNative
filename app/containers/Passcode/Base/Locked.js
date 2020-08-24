import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid } from 'react-native-easy-grid';

import { themes } from '../../../constants/colors';
import { resetAttempts } from '../../../utils/localAuthentication';
import { TYPE } from '../constants';
import { getLockedUntil, getDiff } from '../utils';
import I18n from '../../../i18n';
import styles from './styles';
import Title from './Title';
import Subtitle from './Subtitle';
import LockIcon from './LockIcon';

const Timer = React.memo(({ time, theme, setStatus }) => {
	const calcTimeLeft = () => {
		const diff = getDiff(time);
		if (diff > 0) {
			return Math.floor((diff / 1000) % 60);
		}
	};

	const [timeLeft, setTimeLeft] = useState(calcTimeLeft());

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

const Locked = React.memo(({ theme, setStatus }) => {
	const [lockedUntil, setLockedUntil] = useState(null);

	const readItemFromStorage = async() => {
		const l = await getLockedUntil();
		setLockedUntil(l);
	};

	useEffect(() => {
		readItemFromStorage();
	}, []);

	return (
		<Grid style={[styles.grid, { backgroundColor: themes[theme].passcodeBackground }]} r>
			<LockIcon theme={theme} />
			<Title text={I18n.t('Passcode_app_locked_title')} theme={theme} />
			<Timer theme={theme} time={lockedUntil} setStatus={setStatus} />
		</Grid>
	);
});

Locked.propTypes = {
	theme: PropTypes.string,
	setStatus: PropTypes.func
};

Timer.propTypes = {
	time: PropTypes.string,
	theme: PropTypes.string,
	setStatus: PropTypes.func
};

export default Locked;
