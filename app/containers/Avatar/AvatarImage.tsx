import { useState } from 'react';
import { Image } from 'expo-image';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { headers } from '~/lib/methods/helpers/fetch';
import { useTheme } from '~/theme';
import AvatarSkeleton from './AvatarSkeleton';

interface IAvatarImage {
	uri?: string;
	size: number;
	borderRadius: number;
}

const AvatarImage = ({ uri, size, borderRadius }: IAvatarImage) => {
	const { colors } = useTheme();
	const [finishedUri, setFinishedUri] = useState<string | undefined>();
	const showSkeleton = !!uri && finishedUri !== uri;

	const onFinish = () => setFinishedUri(uri);

	return (
		<>
			<Image
				style={{ width: size, height: size, borderRadius, backgroundColor: colors.surfaceNeutral }}
				source={{
					uri,
					headers: RocketChatSettings.customHeaders ?? headers
				}}
				priority='high'
				recyclingKey={uri}
				onLoad={onFinish}
				onError={onFinish}
			/>
			{showSkeleton ? <AvatarSkeleton size={size} borderRadius={borderRadius} /> : null}
		</>
	);
};

export default AvatarImage;
