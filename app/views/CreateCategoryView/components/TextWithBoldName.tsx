import { type StyleProp, Text, type TextStyle } from 'react-native';

import I18n from '~/i18n';
import sharedStyles from '~/views/Styles';

const NAME_PLACEHOLDER = '\u0000';

interface ITextWithBoldName {
	translationKey: string;
	name: string;
	style: StyleProp<TextStyle>;
}

const TextWithBoldName = ({ translationKey, name, style }: ITextWithBoldName) => {
	const [before, after] = I18n.t(translationKey, { name: NAME_PLACEHOLDER }).split(NAME_PLACEHOLDER);
	return (
		<Text style={style}>
			{before}
			<Text style={sharedStyles.textSemibold}>{name}</Text>
			{after}
		</Text>
	);
};

export default TextWithBoldName;
