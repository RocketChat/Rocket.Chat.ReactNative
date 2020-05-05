import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import * as Haptics from 'expo-haptics';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import Base from './Base';
import { TYPE } from './constants';
import I18n from '../../i18n';

const PasscodeChoose = ({ theme, finishProcess, force = false }) => {
	const chooseRef = useRef(null);
	const confirmRef = useRef(null);
	const [subtitle, setSubtitle] = useState(null);
	const [status, setStatus] = useState(TYPE.CHOOSE);
	const [previousPasscode, setPreviouPasscode] = useState(null);

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

	return (
		<Base
			ref={chooseRef}
			theme={theme}
			type={TYPE.CHOOSE}
			onEndProcess={firstStep}
			title={I18n.t('Passcode_choose_title')}
			subtitle={subtitle || (force ? I18n.t('Passcode_choose_force_set') : null)}
		/>
	);
};

PasscodeChoose.propTypes = {
	theme: PropTypes.string,
	force: PropTypes.bool,
	finishProcess: PropTypes.func
};

export default gestureHandlerRootHOC(PasscodeChoose);
