import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import ScreenLockedView from './ScreenLockedView';
import EventEmitter from '../lib/methods/helpers/events';
import { LOCAL_AUTHENTICATE_EMITTER } from '../lib/constants/localAuthentication';

const styles = StyleSheet.create({
	wrapper: {
		flex: 1
	}
});

export default {
	title: 'Views/ScreenLockedView'
};

interface IStoryWrapperProps {
	hasBiometry?: boolean;
	force?: boolean;
}

const StoryWrapper = ({ hasBiometry = false, force = false }: IStoryWrapperProps) => {
	useEffect(() => {
		// Emit the event to show the ScreenLockedView
		EventEmitter.emit(LOCAL_AUTHENTICATE_EMITTER, {
			submit: () => {},
			cancel: () => {},
			hasBiometry,
			force
		});
	}, [hasBiometry, force]);

	return (
		<View style={styles.wrapper}>
			<ScreenLockedView />
		</View>
	);
};

export const Default = () => <StoryWrapper />;

export const WithBiometry = () => <StoryWrapper hasBiometry />;

export const WithCloseButton = () => <StoryWrapper force />;

export const WithBiometryAndClose = () => <StoryWrapper hasBiometry force />;
