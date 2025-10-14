import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import { SupportedVersionsWarning } from './SupportedVersionsWarning';
import { ThemeContext, TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants/colors';
import { longText } from '../../../.rnstorybook/utils';
import { mockedStore as store } from '../../reducers/mockedStore';
import { setSupportedVersions } from '../../actions/supportedVersions';

const styles = StyleSheet.create({
	container: {
		flex: 1
	}
});

export default {
	title: 'SupportedVersions/SupportedVersionsWarning'
};

const Wrapper = ({ children, theme = 'light' }: { children: React.ReactNode; theme?: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: themes[theme] }}>
		<View style={styles.container}>{children}</View>
	</ThemeContext.Provider>
);

export const Default = () => {
	useEffect(() => {
		store.dispatch(
			setSupportedVersions({
				status: 'warn',
				message: {
					remainingDays: 30,
					type: 'alert',
					title: 'title_key',
					subtitle: 'subtitle_key',
					description: 'description_key',
					link: 'https://rocket.chat/docs'
				},
				i18n: {
					en: {
						title_key: 'Update Required',
						subtitle_key: 'Your workspace version is outdated',
						description_key:
							'Please update your Rocket.Chat server to continue using this app. Your current version will stop working soon.'
					}
				},
				expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
			})
		);
	}, []);

	return (
		<Wrapper>
			<SupportedVersionsWarning />
		</Wrapper>
	);
};

export const LongContent = () => {
	useEffect(() => {
		store.dispatch(
			setSupportedVersions({
				status: 'warn',
				message: {
					remainingDays: 7,
					type: 'error',
					title: 'long_title_key',
					subtitle: 'long_subtitle_key',
					description: 'long_description_key',
					link: 'https://rocket.chat/docs'
				},
				i18n: {
					en: {
						long_title_key: 'Critical Update Required - Your Server Version is Outdated',
						long_subtitle_key: 'Immediate action needed to maintain service',
						long_description_key: longText
					}
				},
				expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
			})
		);
	}, []);

	return (
		<Wrapper>
			<SupportedVersionsWarning />
		</Wrapper>
	);
};

export const MinimalMessage = () => {
	useEffect(() => {
		store.dispatch(
			setSupportedVersions({
				status: 'warn',
				message: {
					remainingDays: 15,
					type: 'info',
					title: 'minimal_title_key',
					description: 'minimal_description_key',
					link: 'https://rocket.chat/docs'
				},
				i18n: {
					en: {
						minimal_title_key: 'Update Required',
						minimal_description_key: 'Please update your server.'
					}
				},
				expiration: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
			})
		);
	}, []);

	return (
		<Wrapper>
			<SupportedVersionsWarning />
		</Wrapper>
	);
};

export const WithoutSubtitle = () => {
	useEffect(() => {
		store.dispatch(
			setSupportedVersions({
				status: 'warn',
				message: {
					remainingDays: 20,
					type: 'info',
					title: 'no_subtitle_title_key',
					description: 'no_subtitle_description_key',
					link: 'https://rocket.chat/docs'
				},
				i18n: {
					en: {
						no_subtitle_title_key: 'Server Update Available',
						no_subtitle_description_key:
							'A new version of Rocket.Chat is available. Update your server to access the latest features and security improvements.'
					}
				},
				expiration: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
			})
		);
	}, []);

	return (
		<Wrapper>
			<SupportedVersionsWarning />
		</Wrapper>
	);
};

export const DarkTheme = () => {
	useEffect(() => {
		store.dispatch(
			setSupportedVersions({
				status: 'warn',
				message: {
					remainingDays: 30,
					type: 'alert',
					title: 'theme_title_key',
					subtitle: 'theme_subtitle_key',
					description: 'theme_description_key',
					link: 'https://rocket.chat/docs'
				},
				i18n: {
					en: {
						theme_title_key: 'Update Required',
						theme_subtitle_key: 'Your workspace version is outdated',
						theme_description_key:
							'Please update your Rocket.Chat server to continue using this app. Your current version will stop working soon.'
					}
				},
				expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
			})
		);
	}, []);

	return (
		<Wrapper theme='dark'>
			<SupportedVersionsWarning />
		</Wrapper>
	);
};

export const BlackTheme = () => {
	useEffect(() => {
		store.dispatch(
			setSupportedVersions({
				status: 'warn',
				message: {
					remainingDays: 30,
					type: 'alert',
					title: 'theme_title_key',
					subtitle: 'theme_subtitle_key',
					description: 'theme_description_key',
					link: 'https://rocket.chat/docs'
				},
				i18n: {
					en: {
						theme_title_key: 'Update Required',
						theme_subtitle_key: 'Your workspace version is outdated',
						theme_description_key:
							'Please update your Rocket.Chat server to continue using this app. Your current version will stop working soon.'
					}
				},
				expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
			})
		);
	}, []);

	return (
		<Wrapper theme='black'>
			<SupportedVersionsWarning />
		</Wrapper>
	);
};
