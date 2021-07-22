import React from 'react';
import { dequal } from 'dequal';

import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import Reply from './Reply';

interface IMessageAttachments {
	attachments: any;
	timeFormat: string;
	showAttachment: Function;
	getCustomEmoji: Function;
	theme: string;
}

const Attachments = React.memo(({
	attachments, timeFormat, showAttachment, getCustomEmoji, theme
}: IMessageAttachments) => {
	if (!attachments || attachments.length === 0) {
		return null;
	}

	return attachments.map((file: any, index: number) => {
		if (file.image_url) {
			return <Image key={file.image_url} file={file} showAttachment={showAttachment} getCustomEmoji={getCustomEmoji} theme={theme} />;
		}
		if (file.audio_url) {
			return <Audio key={file.audio_url} file={file} getCustomEmoji={getCustomEmoji} theme={theme} />;
		}
		if (file.video_url) {
			return <Video key={file.video_url} file={file} showAttachment={showAttachment} getCustomEmoji={getCustomEmoji} theme={theme} />;
		}

		// eslint-disable-next-line react/no-array-index-key
		return <Reply key={index} index={index} attachment={file} timeFormat={timeFormat} getCustomEmoji={getCustomEmoji} theme={theme} />;
	});
}, (prevProps, nextProps) => dequal(prevProps.attachments, nextProps.attachments) && prevProps.theme === nextProps.theme);

Attachments.displayName = 'MessageAttachments';

export default Attachments;
