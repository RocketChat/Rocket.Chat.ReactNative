import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, Button, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView } from 'react-navigation';
import { appColors } from '../theme/colors';
import i18n from '../i18n'
import { HeaderLogo } from '../components/header/HeaderLogo';
import { HeaderCreateThreadButton } from '../components/header/HeaderCreateThreadButton';
import { useQuery } from 'refetch-queries';
import { ThreadsQueries } from '../api';
import { PaginatedThreads } from '../models/threads';
import { TimelineItem } from '../components/TimelineItem';
import {InfiniteScrollView} from "../components/InfiniteScrollView";
import { HeaderLeaderboardButton } from '../components/header/HeaderLeaderboardButton';
import { HeaderTitle } from 'react-navigation-stack';

/**
 * Defines the standard Stylesheet for the Timeline Page.
 */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
    },

    page: {
        backgroundColor: appColors.lightPrimary,
        minHeight: '100%',
    },

    empty: {
        textAlign: 'center',
        fontSize: 16,
    },

    icon: {
        width: 25,
        height: 25,
    },

    filterBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 25,
        width: '100%',
        paddingLeft: 30,
        paddingRight: 30,
        backgroundColor: appColors.lightPrimary,
    },

    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        opacity: 0,
    },
});

/**
 * Creates the Page.
 */
const TimelinePage = ({ navigation }) => {
    
    //The maximum amount of threads that are loaded at once by Lazy Loading
    const perPage = 6;

    /**
     * Fetching more Threads
     */
    const { data, fetchMore, refetch, loading } = useQuery<{ getThreads: PaginatedThreads }>(ThreadsQueries.TIMELINE, {
        variables: {},
        fetchPolicy: "cache-and-network"
    });
    
    /**
     * Hold state whether pull-to-refresh was used
     */
    const [refreshing, setRefreshing] = useState(false);

    const fetchMoreResults = () => {
        if (loading) {
            return;
        }

        fetchMore({
            variables: {
                offset: data?.getThreads.threads.length,
                limit: perPage,
            },
            updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;

                const ids: string[] = [];

                return {
                    getThreads: {
                        threads: [...prev.getThreads.threads, ...fetchMoreResult.getThreads.threads].filter(item => {
                            if (ids.indexOf(item._id!) === -1) {
                                ids.push(item._id!);
                                return true;
                            }

                            return false;
                        }),
                        limit: perPage,
                        offset: fetchMoreResult.getThreads.offset,
                        total: prev.getThreads.threads.length + fetchMoreResult.getThreads.threads.length,
                    },
                }
            },
        })
    };

    const renderLoader = () => {
        return <View style={[styles.loading, { opacity: loading ? 1 : 0 }]}><ActivityIndicator /></View>
    };

    const reset = async () => {
        setRefreshing(true);

        await refetch({});

        setRefreshing(false);
    };

    return <>
        {/*<View style={[styles.filterBar]} >*/}
        {/*    <Text style={[appStyles.bold]}>Alle berichten.</Text>*/}
        {/*    <Image style={[]} source={require('../assets/images/refresh.png')} />*/}

        {/*</View>*/}
        <SafeAreaView>
            <View style={styles.page}>
                <InfiniteScrollView
                    onEndReached={() => fetchMoreResults()}
                    refreshControl={
                        <RefreshControl
                          refreshing={refreshing}
                          onRefresh={() => reset()}
                        />
                    }>
                    <View style={styles.container}>
                        {data?.getThreads.threads.map((item, index) => <TimelineItem key={index} item={item} />)}
                        {renderLoader()}
                    </View>
                </InfiniteScrollView>
                {!loading && data?.getThreads.total === 0 ? <Text style={[appStyles.bold, styles.empty]}>{i18n.t('timeline.empty')}</Text> : null}
            </View>
        </SafeAreaView>
    </>;
};

/**
 * Creation of the Page.
 */
TimelinePage.navigationOptions = ({ navigation }) => {
    return {
        headerTitle: <HeaderLogo />,
        headerRight: <HeaderCreateThreadButton navigation={navigation} />,
        headerLeft: <HeaderLeaderboardButton navigation={navigation} />,
    };
};

export default TimelinePage;
