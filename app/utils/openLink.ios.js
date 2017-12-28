import { Linking } from 'react-native';

const openLink = (url: string) => Linking.openURL(url);

export default openLink;
