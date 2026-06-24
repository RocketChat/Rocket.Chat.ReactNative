import { type ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AttachmentActionSheet } from './AttachmentActionSheet';
import { selectServerRequest } from '../../../../actions/server';
import { mockedStore as store } from '../../../../reducers/mockedStore';
import { type IShareAttachment } from '../../../../definitions';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 16
	}
});

const baseUrl = 'https://open.rocket.chat';

const setServerVersion = (version: string) => {
	store.dispatch(selectServerRequest(baseUrl, version));
};

const imageAttachment: IShareAttachment = {
	filename: 'sunset.jpg',
	size: 245_678,
	mime: 'image/jpeg',
	path: 'https://open.rocket.chat/images/logo/logo.png'
};

const videoAttachment: IShareAttachment = {
	filename: 'walkthrough.mp4',
	size: 9_873_456,
	mime: 'video/mp4',
	path: 'file:///tmp/walkthrough.mp4'
};

const fileAttachment: IShareAttachment = {
	filename: 'requirements.pdf',
	size: 54_321,
	mime: 'application/pdf',
	path: 'file:///tmp/requirements.pdf'
};

const Wrapper = ({ children }: { children: ReactNode }) => <View style={styles.container}>{children}</View>;

export default {
	title: 'MessageComposer/AttachmentActionSheet',
	component: AttachmentActionSheet
};

export const Image = () => {
	setServerVersion('8.4.0');
	return (
		<Wrapper>
			<AttachmentActionSheet attachment={imageAttachment} onSave={() => {}} />
		</Wrapper>
	);
};

export const ImageWithPrefilledAltText = () => {
	setServerVersion('8.4.0');
	return (
		<Wrapper>
			<AttachmentActionSheet attachment={{ ...imageAttachment, altText: 'A bright sunset over the ocean' }} onSave={() => {}} />
		</Wrapper>
	);
};

export const ImageOnLegacyServer = () => {
	setServerVersion('8.3.0');
	return (
		<Wrapper>
			<AttachmentActionSheet attachment={imageAttachment} onSave={() => {}} />
		</Wrapper>
	);
};

export const Video = () => {
	setServerVersion('8.4.0');
	return (
		<Wrapper>
			<AttachmentActionSheet attachment={videoAttachment} onSave={() => {}} />
		</Wrapper>
	);
};

export const File = () => {
	setServerVersion('8.4.0');
	return (
		<Wrapper>
			<AttachmentActionSheet attachment={fileAttachment} onSave={() => {}} />
		</Wrapper>
	);
};
