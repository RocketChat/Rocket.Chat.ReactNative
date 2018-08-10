import SafariView from 'react-native-safari-view';

const openLink = url => SafariView.show({ url, fromBottom: true, tintColor: '#292E35' });

export default openLink;
