import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import * as Haptics from 'expo-haptics';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { sha256 } from 'js-sha256';

import Base from './Base';
import { TYPE } from './constants';
import I18n from '../../i18n';
import { PASSCODE_KEY } from '../../constants/localAuthentication';
import UserPreferences from '../../lib/userPreferences';

const PasscodeChange = ({ theme, finishProcess, force = false }) => {
	const validateRef = useRef(null);
	const chooseRef = useRef(null);
	const confirmRef = useRef(null);
	const [subtitle, setSubtitle] = useState(null);
	const [status, setStatus] = useState(TYPE.VALIDATE);
	const [previousPasscode, setPreviouPasscode] = useState(null);
	const [currentUserPasscode, setCurrentUserPasscode] = useState(null);

	const fetchPasscode = async() => {
		const p = await UserPreferences.getStringAsync(PASSCODE_KEY);
		setCurrentUserPasscode(p);
	};

	const readStorage = async() => {
		await fetchPasscode();
	};

	useEffect(() => {
		readStorage();
	}, [status]);

	const validateUser = (p) => {
		if (sha256(p) !== currentUserPasscode) {
			setTimeout(() => {
				setStatus(TYPE.VALIDATE);
				setSubtitle(I18n.t('Invalid_user_error'));
				validateRef?.current?.animate('shake');
				validateRef?.current?.clearPasscode();
				Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Error
				);
			}, 200);
		} else {
			setTimeout(() => {
				setStatus(TYPE.CHOOSE);
				chooseRef?.current?.clearPasscode();
			}, 200);
		}
	};

	const firstStep = (p) => {
		setTimeout(() => {
			setStatus(TYPE.CONFIRM);
			setPreviouPasscode(p);
			confirmRef?.current?.clearPasscode();
		}, 200);
	};

	const changePasscode = p => finishProcess && finishProcess(p);

	const onError = () => {
		setTimeout(() => {
			setStatus(TYPE.CHOOSE);
			setSubtitle(I18n.t('Passcode_choose_error'));
			chooseRef?.current?.animate('shake');
			chooseRef?.current?.clearPasscode();
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		}, 200);
	};

	if (status === TYPE.CONFIRM) {
		return (
			<Base
				ref={confirmRef}
				theme={theme}
				type={TYPE.CONFIRM}
				onEndProcess={changePasscode}
				previousPasscode={previousPasscode}
				title={I18n.t('Passcode_choose_confirm_title')}
				onError={onError}
			/>
		);
	}

	if (status === TYPE.CHOOSE) {
		return (
			<Base
				ref={chooseRef}
				theme={theme}
				type={TYPE.CHOOSE}
				onEndProcess={firstStep}
				title={I18n.t('Passcode_choose_title')}
				subtitle={
					subtitle
					|| (force ? I18n.t('Passcode_choose_force_set') : null)
				}
			/>
		);
	}

	return (
		<Base
			currentUserPasscode={currentUserPasscode}
			ref={validateRef}
			theme={theme}
			type={TYPE.CHOOSE}
			onEndProcess={validateUser}
			title={I18n.t('User_validate_title')}
			subtitle={
				subtitle || (force ? I18n.t('Passcode_choose_force_set') : null)
			}
		/>
	);
};

PasscodeChange.propTypes = {
	theme: PropTypes.string,
	force: PropTypes.bool,
	finishProcess: PropTypes.func
};

export default gestureHandlerRootHOC(PasscodeChange);
