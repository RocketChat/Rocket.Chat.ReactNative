import { StyleSheet } from 'react-native'
import { appColors } from './colors';

export const appStyles = StyleSheet.create({
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 20,
        fontFamily: 'Cabin-Bold',
        color: appColors.primary,
    },
    text: {
        fontFamily: 'Cabin-Regular',
        fontSize: 16,
        color: appColors.text,
    },
    linkText: {
        fontFamily: 'Cabin-Regular',
        fontSize: 16,
        color: appColors.primary,
    },
    buttonText: {
        fontFamily: 'Cabin-SemiBold',
        fontSize: 16,
        color: appColors.light,
    },
    errorText: {
        fontFamily: 'Cabin-SemiBold',
        fontSize: 16,
        color: appColors.light,
    },
    label: {
        fontSize: 16,
        fontFamily: 'Cabin-SemiBold',
        color: appColors.primary,
        marginBottom: 2,
    },
    inputText: {
        fontFamily: 'Cabin-Regular',
    },
    formGroup: {
        marginTop: 20,
    },
    toggledText: {
        color: appColors.toggled
    }
});