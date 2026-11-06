import { useState } from 'react';
import { Image } from 'expo-image';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { headers } from '~/lib/methods/helpers/fetch';
import { useTheme } from '~/theme';
import AvatarSkeleton from './AvatarSkeleton';

interface IAvatarImage {
	uri?: string;
	style: { width: number; height: number; borderRadius: number };
}

const AvatarImage = ({ uri, style }: IAvatarImage) => {
	const { colors } = useTheme();
	const [finishedUri, setFinishedUri] = useState<string | undefined>();
	const showSkeleton = !!uri && finishedUri !== uri;

	const onFinish = () => setFinishedUri(uri);

	return (
		<>
			<Image
				style={{ ...style, backgroundColor: colors.surfaceNeutral }}
				source={{
					uri,
					headers: RocketChatSettings.customHeaders ?? headers
				}}
				priority='high'
				recyclingKey={uri}
				onLoad={onFinish}
				onError={onFinish}
			/>
			{showSkeleton ? (
				<AvatarSkeleton
					size={style.width}
					borderRadius={style.borderRadius}
					backgroundColor={colors.surfaceNeutral}
					highlightColor={colors.surfaceSelected}
				/>
			) : null}
		</>
	);
};

export default AvatarImage;
