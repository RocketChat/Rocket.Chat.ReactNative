import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import ChangePasscodeView from './ChangePasscodeView';
import EventEmitter from '../lib/methods/helpers/events';
import { CHANGE_PASSCODE_EMITTER } from '../lib/constants/localAuthentication';

const styles = StyleSheet.create({
	wrapper: {
		flex: 1
	}
});

export default {
	title: 'Views/ChangePasscodeView'
};

interface IStoryWrapperProps {
	force?: boolean;
}

const StoryWrapper = ({ force = false }: IStoryWrapperProps) => {
	useEffect(() => {
		// Emit the event to show the ChangePasscodeView
		EventEmitter.emit(CHANGE_PASSCODE_EMITTER, {
			submit: () => {},
			cancel: () => {},
			force
		});
	}, [force]);

	return (
		<View style={styles.wrapper}>
			<ChangePasscodeView />
		</View>
	);
};

export const Default = () => <StoryWrapper />;

export const Forced = () => <StoryWrapper force />;
