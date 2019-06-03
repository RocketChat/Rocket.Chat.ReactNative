import SafariView from 'react-native-safari-view';

import { HEADER_BACK } from '../../constants/colors';

const openLink = url => SafariView.show({ url, fromBottom: false, tintColor: HEADER_BACK });

export default openLink;
