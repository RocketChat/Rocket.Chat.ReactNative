import React, { useEffect, useState } from 'react';
import {
	View, StyleSheet, Text
} from 'react-native';
import PropTypes from 'prop-types';

import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import { resetAttempts } from '../../utils/localAuthentication';
import { TYPE } from './constants';
import { getLockedUntil } from './utils';

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

	const readItemFromStorage = async() => {
		const l = await getLockedUntil();
		setLockedUntil(l);
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
