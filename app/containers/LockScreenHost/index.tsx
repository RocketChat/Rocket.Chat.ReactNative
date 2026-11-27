import Modal from 'react-native-modal';

import type { ILockScreenHostProps } from './types';

export const LockScreenHost = ({ visible, onShown, onHidden, children }: ILockScreenHostProps) => (
	<Modal
		useNativeDriver
		isVisible={visible}
		hideModalContentWhileAnimating
		style={{ margin: 0 }}
		animationIn='fadeIn'
		animationOut='fadeOut'
		onModalShow={onShown}
		onModalHide={onHidden}>
		{children}
	</Modal>
);
