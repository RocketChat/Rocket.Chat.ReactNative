import React from 'react';
import { PropTypes, Text } from 'react-native';
import { themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';

const Code = ({
	type, styles, style, literal
}) => {
	const theme = useTheme();
	return (
		<Text
			style={[
				{
					...(type === 'CODE_INLINE' ? styles.codeInline : styles.codeBlock),
					color: themes[theme].bodyText,
					backgroundColor: themes[theme].bannerBackground,
					borderColor: themes[theme].bannerBackground
				},
				...style
			]}
		>
			{literal}
		</Text>
	);
};

Code.propTypes = {
	type: PropTypes.string,
	literal: PropTypes.string,
	styles: PropTypes.object,
	style: PropTypes.object
};

export default Code;
