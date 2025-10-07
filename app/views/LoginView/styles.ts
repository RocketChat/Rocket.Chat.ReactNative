import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
        title: {
                ...sharedStyles.textBold,
                fontSize: 22,
                marginBottom: 24
        },
        credentialsContainer: {
                gap: 20
        }
});
