import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import { SupportedVersionsExpired } from './SupportedVersionsExpired';
import { ThemeContext, TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants/colors';
import { mockedStore as store } from '../../reducers/mockedStore';
import { selectServerSuccess } from '../../actions/server';

const styles = StyleSheet.create({
	container: {
		flex: 1
	}
});

export default {
	title: 'SupportedVersions/SupportedVersionsExpired'
};

const Wrapper = ({ children, theme = 'light' }: { children: React.ReactNode; theme?: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: themes[theme] }}>
		<View style={styles.container}>{children}</View>
	</ThemeContext.Provider>
);

export const Default = () => {
	useEffect(() => {
		store.dispatch(
			selectServerSuccess({
				server: 'https://open.rocket.chat',
				version: '7.0.0',
				name: 'Open ws'
			})
		);
	}, []);

	return (
		<Wrapper>
			<SupportedVersionsExpired />
		</Wrapper>
	);
};

export const WithLongWorkspaceName = () => {
	useEffect(() => {
		store.dispatch(
			selectServerSuccess({
				server: 'https://my-very-long-workspace-name-for-testing.rocket.chat',
				version: '7.0.0',
				name: 'My Very Long Workspace Name For Testing'
			})
		);
	}, []);

	return (
		<Wrapper>
			<SupportedVersionsExpired />
		</Wrapper>
	);
};

export const DarkTheme = () => {
	useEffect(() => {
		store.dispatch(
			selectServerSuccess({
				server: 'https://open.rocket.chat',
				version: '7.0.0',
				name: 'Open ws'
			})
		);
	}, []);

	return (
		<Wrapper theme='dark'>
			<SupportedVersionsExpired />
		</Wrapper>
	);
};

export const BlackTheme = () => {
	useEffect(() => {
		store.dispatch(
			selectServerSuccess({
				server: 'https://open.rocket.chat',
				version: '7.0.0',
				name: 'Open ws'
			})
		);
	}, []);

	return (
		<Wrapper theme='black'>
			<SupportedVersionsExpired />
		</Wrapper>
	);
};
