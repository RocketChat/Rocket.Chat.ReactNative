import React, { useEffect, useState } from 'react';
import {
	View, StyleSheet, Text
} from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';
import { useAsyncStorage } from '@react-native-community/async-storage';

import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import {
	PASSCODE_KEY, PASSCODE_LENGTH, LOCAL_AUTHENTICATE_EMITTER, LOCKED_OUT_TIMER_KEY, ATTEMPTS_KEY
} from '../../constants/localAuthentication';
import { resetAttempts } from '../../utils/localAuthentication';
import { TYPE } from './constants';

const TIME_TO_LOCK = 10000;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		width: '100%'
	},
	title: {
		...sharedStyles.textRegular,
		fontSize: 20,
		fontWeight: '400',
		marginBottom: 10,
		textAlign: 'center'
	},
	subtitle: {
		...sharedStyles.textRegular,
		fontSize: 16,
		fontWeight: '400',
		textAlign: 'center'
	}
});

const getLockedUntil = t => moment(t).add(TIME_TO_LOCK);

const getDiff = t => new Date(t) - new Date();

const Timer = ({ time, theme, setStatus }) => {
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

	return (
		<Text style={[styles.subtitle, { color: themes[theme].bodyText }]}>Try again in {timeLeft} seconds</Text>
	);
};

const Locked = ({ theme, setStatus }) => {
	const [lockedUntil, setLockedUntil] = useState(null);
	const { getItem } = useAsyncStorage(LOCKED_OUT_TIMER_KEY);

	const readItemFromStorage = async() => {
		const item = await getItem();
		setLockedUntil(getLockedUntil(item));
	};

	useEffect(() => {
		readItemFromStorage();
	}, []);

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
			<Text style={[styles.title, { color: themes[theme].titleText }]}>App locked</Text>
			<Timer theme={theme} time={lockedUntil} setStatus={setStatus} />
		</View>
	);
};

export default Locked;
