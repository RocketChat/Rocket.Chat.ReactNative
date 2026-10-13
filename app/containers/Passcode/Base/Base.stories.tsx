import { useRef } from 'react';
import { View } from 'react-native';

import Base, { type IBase } from '.';
import { TYPE } from '../constants';

export default {
	title: 'Passcode/Base'
};

const PasscodeBase = ({ ...props }) => {
	const ref = useRef<IBase>(null);
	return <Base ref={ref} type={TYPE.CHOOSE} title='Create Passcode' onEndProcess={() => {}} {...props} />;
};

export const ChooseType = () => (
	<View style={{ flex: 1 }}>
		<PasscodeBase type={TYPE.CHOOSE} title='Create Passcode' />
	</View>
);

export const ConfirmType = () => (
	<View style={{ flex: 1 }}>
		<PasscodeBase type={TYPE.CONFIRM} title='Confirm Passcode' previousPasscode='123456' onError={() => {}} />
	</View>
);

export const EnterType = () => (
	<View style={{ flex: 1 }}>
		<PasscodeBase type={TYPE.ENTER} title='Enter Passcode' />
	</View>
);

export const WithSubtitle = () => (
	<View style={{ flex: 1 }}>
		<PasscodeBase type={TYPE.CHOOSE} title='Create Passcode' subtitle='This passcode will protect your data' />
	</View>
);

export const WithBiometry = () => (
	<View style={{ flex: 1 }}>
		<PasscodeBase type={TYPE.ENTER} title='Enter Passcode' showBiometry onBiometryPress={() => {}} />
	</View>
);

export const EnterWithSubtitleAndBiometry = () => (
	<View style={{ flex: 1 }}>
		<PasscodeBase
			type={TYPE.ENTER}
			title='Unlock App'
			subtitle='Authentication required'
			showBiometry
			onBiometryPress={() => {}}
		/>
	</View>
);
