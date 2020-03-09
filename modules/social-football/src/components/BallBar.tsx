import React from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity} from 'react-native';
import {ThreadModel} from "../models/threads";
import {appStyles} from "../theme/style";
import i18n from '../i18n'
import {ThreadsMutations, ThreadsQueries} from "../api";
import { useMutation } from 'refetch-queries';

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flex: 1,
        marginTop: 10,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
    },
    button: {
        height: 20,
        resizeMode: 'contain',
    },
});

interface Props {
    item: ThreadModel;
}

export const BallBar = ({ item }: Props) => {
    const [performBall, { loading }] = useMutation(ThreadsMutations.CREATE_BALL);

    return <View style={[styles.container]}>
        <Text style={[appStyles.label]}>{i18n.t(item.balls === 1 ? 'ballBar.ball' : 'ballBar.balls', { count: String(item.balls) })}</Text>
        {!item.balled && !loading && <TouchableOpacity onPress={() => {
            performBall({
                variables: {
                    threadId: item._id,
                },
                refetchQueriesMatch: [
                    {
                        query: ThreadsQueries.TIMELINE,
                        variables: {}
                    }
                ],
            })
        }}>
			<Image style={styles.button} source={require('../assets/images/ball.png')} />
        </TouchableOpacity>}
    </View>
};
