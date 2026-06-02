import isEmpty from 'lodash/isEmpty';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PasscodeEnter } from '../containers/Passcode';
import { LOCAL_AUTHENTICATE_EMITTER } from '../lib/constants/localAuthentication';
import { CustomIcon } from '../containers/CustomIcon';
import { hasNotch } from '../lib/methods/helpers';
import EventEmitter from '../lib/methods/helpers/events';
import Touch from '../containers/Touch';

interface IData {
	submit?: () => void;
	cancel?: () => void;
	hasBiometry?: boolean;
	force?: boolean;
	skipAutoBiometry?: boolean;
	reason?: 'enrollmentChanged';
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	close: {
		position: 'absolute',
		top: hasNotch ? 50 : 30,
		left: 15
	}
});

const ScreenLockedView = (): JSX.Element => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState<IData>({});
	const pendingResolve = useRef<(() => void) | null>(null);

	useDeepCompareEffect(() => {
		if (!isEmpty(data)) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showScreenLock = (args: IData) => {
		// A new request can arrive while the previous modal is still animating out, before
		// onModalHide consumed its resolve. Flush it now so the previous caller isn't left hanging.
		const pending = pendingResolve.current;
		pendingResolve.current = null;
		pending?.();
		setData(args);
	};

	useEffect(() => {
		const listener = EventEmitter.addEventListener(LOCAL_AUTHENTICATE_EMITTER, showScreenLock);
		return () => {
			EventEmitter.removeListener(LOCAL_AUTHENTICATE_EMITTER, listener);
		};
	}, []);

	const onSubmit = () => {
		pendingResolve.current = data.submit ?? null;
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

	return (
		<Modal
			useNativeDriver
			isVisible={visible}
			hideModalContentWhileAnimating
			style={{ margin: 0 }}
			animationIn='fadeIn'
			animationOut='fadeOut'
			onModalHide={onModalHide}>
			<GestureHandlerRootView style={styles.container}>
				<PasscodeEnter
					hasBiometry={!!data?.hasBiometry}
					skipAutoBiometry={!!data?.skipAutoBiometry}
					reason={data?.reason}
					finishProcess={onSubmit}
				/>
				{data?.force ? (
					<Touch onPress={onCancel} style={styles.close}>
						<CustomIcon name='close' size={30} />
					</Touch>
				) : null}
			</GestureHandlerRootView>
		</Modal>
	);
};

export default ScreenLockedView;
