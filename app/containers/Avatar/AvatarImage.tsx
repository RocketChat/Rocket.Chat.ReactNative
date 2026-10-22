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
	const [settledUri, setSettledUri] = useState<string | undefined>();
	const showSkeleton = settledUri !== uri;

	const onSettled = () => setSettledUri(uri);

	return (
		<View style={[style, { backgroundColor: colors.surfaceNeutral }]}>
			<Image
				style={style}
				source={{
					uri,
					headers: RocketChatSettings.customHeaders ?? headers
				}}
				priority='high'
				recyclingKey={uri}
				onLoad={onSettled}
				onError={onSettled}
			/>
			{showSkeleton ? <AvatarSkeleton borderRadius={style.borderRadius} /> : null}
		</View>
	);
};

export default AvatarImage;
