import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import useDeepCompareEffect from 'use-deep-compare-effect';
import isEmpty from 'lodash/isEmpty';
import Modal from 'react-native-modal';
import Touchable from 'react-native-platform-touchable';

import { hasNotch } from '../lib/methods/helpers';
import { PasscodeChoose } from '../containers/Passcode';
import EventEmitter from '../lib/methods/helpers/events';
import { CustomIcon } from '../containers/CustomIcon';
import { CHANGE_PASSCODE_EMITTER } from '../lib/constants';

const styles = StyleSheet.create({
	modal: {
		margin: 0
	},
	close: {
		position: 'absolute',
		top: hasNotch ? 50 : 30,
		left: 15
	}
});

interface IArgs {
	submit(passcode: string): void;
	cancel(): void;
	force: boolean;
}

const ChangePasscodeView = React.memo(() => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState<Partial<IArgs>>({});

	useDeepCompareEffect(() => {
		if (!isEmpty(data)) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showChangePasscode = (args: IArgs) => {
		setData(args);
	};

	const onSubmit = (passcode: string) => {
		const { submit } = data;
		if (submit) {
			submit(passcode);
		}
		setData({});
	};

	const onCancel = () => {
		const { cancel } = data;
		if (cancel) {
			cancel();
		}
		setData({});
	};

	useEffect(() => {
		const listener = EventEmitter.addEventListener(CHANGE_PASSCODE_EMITTER, showChangePasscode);
		return () => {
			EventEmitter.removeListener(CHANGE_PASSCODE_EMITTER, listener);
		};
	}, []);

	return (
		<Modal useNativeDriver isVisible={visible} hideModalContentWhileAnimating style={styles.modal}>
			<PasscodeChoose finishProcess={onSubmit} force={data?.force} />
			{!data?.force ? (
				<Touchable onPress={onCancel} style={styles.close}>
					<CustomIcon name='close' size={30} />
				</Touchable>
			) : null}
		</Modal>
	);
});

export default ChangePasscodeView;
