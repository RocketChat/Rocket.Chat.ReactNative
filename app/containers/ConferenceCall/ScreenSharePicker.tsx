import { ScreenCapturePickerView } from '@livekit/react-native-webrtc';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { findNodeHandle, NativeModules, type View } from 'react-native';

export type TScreenSharePickerHandle = { show: () => Promise<void> };

const ScreenSharePicker = forwardRef<TScreenSharePickerHandle>((_props, ref) => {
	const pickerRef = useRef<View>(null);

	useImperativeHandle(ref, () => ({
		show: async () => {
			const reactTag = findNodeHandle(pickerRef.current);
			if (reactTag) {
				await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
			}
		}
	}));

	return <ScreenCapturePickerView ref={pickerRef} />;
});

export default ScreenSharePicker;
