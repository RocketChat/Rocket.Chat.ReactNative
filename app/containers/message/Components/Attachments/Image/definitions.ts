import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { Image } from 'expo-image';

import { IAttachment, IUserMessage } from '../../../../../definitions';
import { TGetCustomEmoji } from '../../../../../definitions/IEmoji';
import { TDownloadState } from '../../../../../lib/methods/handleMediaDownload';

export interface IImageContainer {
	file: IAttachment;
	showAttachment?: (file: IAttachment) => void;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	getCustomEmoji?: TGetCustomEmoji;
	author?: IUserMessage;
	msg?: string;
	imagePreview?: string;
	imageType?: string;
}

export interface IMessageImage {
	uri: string;
	status: TDownloadState;
	encrypted: boolean;
	isGif: boolean;
	imagePreview?: string;
	imageType?: string;
	autoplayGifs?: boolean;
	expoImageRef?: React.RefObject<Image>;
}
