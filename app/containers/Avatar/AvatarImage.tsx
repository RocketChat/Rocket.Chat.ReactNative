import { useState } from 'react';
import { type ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { headers } from '~/lib/methods/helpers/fetch';
import { useTheme } from '~/theme';
import AvatarSkeleton from './AvatarSkeleton';

interface IAvatarImage {
	uri?: string;
	style: ImageStyle;
}

const AvatarImage = ({ uri, style }: IAvatarImage) => {
	const { colors } = useTheme();
	const [finishedUri, setFinishedUri] = useState<string | undefined>();
	const showSkeleton = !!uri && finishedUri !== uri;

	const onFinish = () => setFinishedUri(uri);

	return (
		<>
			<Image
				style={[style, { backgroundColor: colors.surfaceNeutral }]}
				source={{
					uri,
					headers: RocketChatSettings.customHeaders ?? headers
				}}
				priority='high'
				recyclingKey={uri}
				onLoad={onFinish}
				onError={onFinish}
			/>
			{showSkeleton ? <AvatarSkeleton style={style} /> : null}
		</>
	);
};

export default AvatarImage;
