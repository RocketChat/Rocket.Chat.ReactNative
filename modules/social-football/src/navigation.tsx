import React, { forwardRef, useEffect, useState } from 'react';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import SecurityManager from './security/security-manager';
import i18n from './i18n';

export const pages = {
    unauthenticated: {
        LoginPage: {
            getScreen: () => require('./pages/LoginPage').default
        },
        RegisterPage: {
            getScreen: () => require('./pages/RegisterPage').default
        }
    },
    authenticated: {
        TimelinePage: {
            getScreen: () => require('./pages/TimelinePage').default
        },
    }
};

export const UnaunthenticatedNavigation: any = createAppContainer(createStackNavigator(
    pages.unauthenticated,
    {
        initialRouteName: 'LoginPage',
        headerMode: 'none',
    }
));

export const AuthenticatedNavigation: any = createAppContainer(createSwitchNavigator(
    pages.authenticated,
    {
        initialRouteName: 'TimelinePage',
    }
));

const styles = StyleSheet.create({
    activityHolder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    }
});

export const Navigation = forwardRef((props, ref) => {
    const [login, setLogin] = useState(null);

    useEffect(() => {
        SecurityManager.login$.subscribe(value => {
            setLogin(value);
        });
    }, []);

    return <>
        {login === null ? <View style={[styles.activityHolder]}><ActivityIndicator /></View> : (
                (login === false)
            ?
                <UnaunthenticatedNavigation ref={ref} />
            :
                <AuthenticatedNavigation ref={ref} />
        )}
    </>
});
