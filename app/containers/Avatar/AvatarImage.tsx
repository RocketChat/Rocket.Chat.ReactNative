import { useState } from 'react';
import { View, type ImageStyle } from 'react-native';
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
	const [loadedUri, setLoadedUri] = useState<string | undefined>();
	const showSkeleton = loadedUri !== uri;

	const onEnd = () => setLoadedUri(uri);

	return (
		<View style={[style, { backgroundColor: colors.surfaceNeutral }]}>
			<Image
				style={style}
				source={{
					uri,
					headers: RocketChatSettings.customHeaders ?? headers
				}}
				priority='high'
				onLoad={onEnd}
				onError={onEnd}
			/>
			{showSkeleton ? <AvatarSkeleton borderRadius={style.borderRadius} /> : null}
		</View>
	);
};

export default AvatarImage;
