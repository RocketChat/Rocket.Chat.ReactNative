import React, { useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

import Base, { IBase } from './Base';
import { TYPE } from './constants';
import i18n from '../../i18n';

interface IPasscodeChoose {
	force?: boolean;
	finishProcess: Function;
}

const PasscodeChoose = ({ finishProcess, force = false }: IPasscodeChoose) => {
	const chooseRef = useRef<IBase>(null);
	const confirmRef = useRef<IBase>(null);
	const [subtitle, setSubtitle] = useState<string | null>(null);
	const [status, setStatus] = useState(TYPE.CHOOSE);
	const [previousPasscode, setPreviouPasscode] = useState('');

	const firstStep = (p: string) => {
		setTimeout(() => {
			setStatus(TYPE.CONFIRM);
			setPreviouPasscode(p);
			confirmRef?.current?.clearPasscode();
		}, 200);
	};

	const changePasscode = (p: string) => finishProcess && finishProcess(p);

	const onError = () => {
		setTimeout(() => {
			setStatus(TYPE.CHOOSE);
			setSubtitle(i18n.t('Passcode_choose_error'));
			chooseRef?.current?.animate('shake');
			chooseRef?.current?.clearPasscode();
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		}, 200);
	};

	if (status === TYPE.CONFIRM) {
		return (
			<Base
				ref={confirmRef}
				type={TYPE.CONFIRM}
				onEndProcess={changePasscode}
				previousPasscode={previousPasscode}
				title={i18n.t('Passcode_choose_confirm_title')}
				onError={onError}
			/>
		);
	}

	return (
		<Base
			ref={chooseRef}
			type={TYPE.CHOOSE}
			onEndProcess={firstStep}
			title={i18n.t('Passcode_choose_title')}
			subtitle={subtitle || (force ? i18n.t('Passcode_choose_force_set') : null)}
		/>
	);
};

export default gestureHandlerRootHOC(PasscodeChoose);
