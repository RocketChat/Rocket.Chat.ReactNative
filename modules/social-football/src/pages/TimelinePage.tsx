import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, Button, ScrollView, ActivityIndicator } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView } from 'react-navigation';
import { appColors } from '../theme/colors';
import i18n from '../i18n'
import { HeaderLogo } from '../components/header/HeaderLogo';
import { HeaderCreateThreadButton } from '../components/header/HeaderCreateThreadButton';
import { useQuery } from 'react-apollo';
import { ThreadsQueries } from '../api';
import { PaginatedThreads } from '../models/threads';
import { TimelineItem } from '../components/TimelineItem';
import {InfiniteScrollView} from "../components/InfiniteScrollView";
import { HeaderLeaderboardButton } from '../components/header/HeaderLeaderboardButton';
import { HeaderTitle } from 'react-navigation-stack';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#FFF1E5',
    },

    icon: {
        width: 25,
        height: 25,
    },

    filterbar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 25,
        width: '100%',
        paddingLeft: 30,
        paddingRight: 30,
        backgroundColor: '#FFF1E5',
    },

    filterText: {
        fontWeight: 'bold'
    },

    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        opacity: 0,
    },
});

const TimelinePage = ({ navigation }) => {
    const perPage = 6;

    const { data, error, fetchMore, loading } = useQuery<{ getThreads: PaginatedThreads }>(ThreadsQueries.TIMELINE, {
        variables: {
            limit: perPage,
        },
        fetchPolicy: "cache-and-network"
    });

    const fetchMoreResults = () => {
        if (loading) {
            return;
        }

        if (!fetchMore) {
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
                            console.log('id', item._id);
                            if (ids.indexOf(item._id!) === -1) {
                                ids.push(item._id!);
                                return false;
                            }

                            return true;
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
        return <View style={[styles.loading, { opacity: loading ? 1 : 0}]}><ActivityIndicator /></View>
    };

    return <>
        {/*<View style={[styles.filterbar]} >*/}
        {/*    <Text style={[styles.filterText]}>Alle berichten.</Text>*/}
        {/*    <Image style={[]} source={require('../assets/images/refresh.png')} />*/}

        {/*</View>*/}
        <InfiniteScrollView onEndReached={() => fetchMoreResults()}>
            <View style={styles.container}>
                {data?.getThreads.threads.map((item, index) => <TimelineItem key={index} item={item} />)}
                {renderLoader()}
            </View>
        </InfiniteScrollView>
    </>;
};

TimelinePage.navigationOptions = ({ navigation }) => {
    return {
        headerTitle: <HeaderLogo />,
        headerRight: <HeaderCreateThreadButton navigation={navigation} />,
        headerLeft: <HeaderLeaderboardButton navigation={navigation} />,
    };
};

export default TimelinePage;
