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
        CreateThreadPage: {
            getScreen: () => require('./pages/CreateThreadPage').default
        },
    },
    loading: {
        LoadingPage: {
            getScreen: () => require('./pages/LoadingPage').default
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

export const AuthenticatedNavigation: any = createAppContainer(createStackNavigator(
    pages.authenticated,
    {
        initialRouteName: 'TimelinePage',
    }
));

export const LoadingNavigator: any = createAppContainer(createSwitchNavigator(
    pages.loading,
    {

    }
));

export const Navigation = forwardRef((props, ref) => {
    const [login, setLogin] = useState<boolean|null>(null);

    useEffect(() => {
        SecurityManager.login$.subscribe(value => {
            setLogin(value);
        });
    }, []);

    return <>
        {login === null ? <LoadingNavigator ref={ref} /> : (
                (login === false)
            ?
                <UnaunthenticatedNavigation ref={ref} />
            :
                <AuthenticatedNavigation ref={ref} />
        )}
    </>
});
