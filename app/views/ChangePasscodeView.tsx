import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import useDeepCompareEffect from 'use-deep-compare-effect';
import isEmpty from 'lodash/isEmpty';
import Modal from 'react-native-modal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { hasNotch } from '../lib/methods/helpers';
import { PasscodeChoose } from '../containers/Passcode';
import EventEmitter from '../lib/methods/helpers/events';
import { CustomIcon } from '../containers/CustomIcon';
import { CHANGE_PASSCODE_EMITTER } from '../lib/constants/localAuthentication';
import Touch from '../containers/Touch';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
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
	const pendingResolve = useRef<(() => void) | null>(null);

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
		pendingResolve.current = submit ? () => submit(passcode) : null;
		setData({});
	};

	const onCancel = () => {
		pendingResolve.current = data.cancel ?? null;
		setData({});
	};

	const onModalHide = () => {
		const resolve = pendingResolve.current;
		pendingResolve.current = null;
		resolve?.();
	};

	useEffect(() => {
		const listener = EventEmitter.addEventListener(CHANGE_PASSCODE_EMITTER, showChangePasscode);
		return () => {
			EventEmitter.removeListener(CHANGE_PASSCODE_EMITTER, listener);
		};
	}, []);

	return (
		<Modal useNativeDriver isVisible={visible} hideModalContentWhileAnimating style={styles.modal} onModalHide={onModalHide}>
			<GestureHandlerRootView style={styles.container}>
				<PasscodeChoose finishProcess={onSubmit} force={data?.force} />
				{!data?.force ? (
					<Touch onPress={onCancel} style={styles.close}>
						<CustomIcon name='close' size={30} />
					</Touch>
				) : null}
			</GestureHandlerRootView>
		</Modal>
	);
});

export default ChangePasscodeView;
