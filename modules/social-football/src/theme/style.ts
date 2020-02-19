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
    description: {
        height:200,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: appColors.inputBorder,
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 10,
        paddingRight: 10,
    },
});