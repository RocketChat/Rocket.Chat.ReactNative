import React from 'react';
import { Image as ImageProps } from '@rocket.chat/message-parser';

import { useTheme } from '../../../theme';
import { MessageImage } from '../../message/Image';

interface IImageProps {
	value: ImageProps['value'];
}

const Image = ({ value }: IImageProps): JSX.Element => {
	const { theme } = useTheme();
	const { src } = value;

	return <MessageImage img={src.value} theme={theme} />;
};

export default Image;
