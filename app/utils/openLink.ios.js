import SafariView from 'react-native-safari-view';

const openLink = url => SafariView.show({ url, fromBottom: true });

export default openLink;
