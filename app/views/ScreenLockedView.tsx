import isEmpty from 'lodash/isEmpty';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PasscodeEnter } from '../containers/Passcode';
import { LOCAL_AUTHENTICATE_EMITTER } from '../lib/constants/localAuthentication';
import { CustomIcon } from '../containers/CustomIcon';
import { hasNotch } from '../lib/methods/helpers';
import EventEmitter from '../lib/methods/helpers/events';
import { useDeferredModalSettle } from '../lib/hooks/useDeferredModalSettle';
import { type BiometricInvalidationReason } from '../definitions';
import Touch from '../containers/Touch';

interface IData {
	submit?: () => void;
	cancel?: () => void;
	hasBiometry?: boolean;
	canClose?: boolean;
	reason?: BiometricInvalidationReason;
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

const ScreenLockedView = () => {
	const [visible, setVisible] = useState(false);
	const [data, setData] = useState<IData>({});
	const [requestId, setRequestId] = useState(0);
	const currentRequestId = useRef(0);
	const { onShow, defer, onModalHide } = useDeferredModalSettle<IData>();

	useDeepCompareEffect(() => {
		if (!isEmpty(data)) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [data]);

	const showScreenLock = useCallback(
		(args: IData) => {
			onShow(args);
			currentRequestId.current += 1;
			setRequestId(currentRequestId.current);
			setData(args);
		},
		[onShow]
	);

	useEffect(() => {
		const listener = EventEmitter.addEventListener(LOCAL_AUTHENTICATE_EMITTER, showScreenLock);
		return () => {
			EventEmitter.removeListener(LOCAL_AUTHENTICATE_EMITTER, listener);
		};
	}, [showScreenLock]);

	const settle = (id: number, callback?: () => void) => {
		if (id !== currentRequestId.current) {
			return;
		}
		defer(callback || null);
		setData({});
	};

	const onSubmit = () => settle(requestId, data.submit);

	const onCancel = () => settle(requestId, data.cancel);

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
				<PasscodeEnter key={requestId} hasBiometry={!!data?.hasBiometry} reason={data?.reason} finishProcess={onSubmit} />
				{data?.canClose ? (
					<Touch onPress={onCancel} style={styles.close}>
						<CustomIcon name='close' size={30} />
					</Touch>
				) : null}
			</GestureHandlerRootView>
		</Modal>
	);
};

export default ScreenLockedView;
