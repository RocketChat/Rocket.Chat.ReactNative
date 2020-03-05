import { View, Text, Image, StyleSheet, Linking } from 'react-native';
import i18n from '../i18n';
import { ThreadModel } from '../models/threads';
import { BallModel } from '../models/balls';
import { appColors } from '../theme/colors';
import { ContentType } from '../enums/content-type';
import React, { useEffect, useState } from 'react';
import Urls from "../../../../app/containers/message/Urls"
import { useQuery, useMutation } from 'react-apollo';
import moment from "moment";
import 'moment/locale/nl';
import { BallQueries, BallMutations } from '../api';
import { Button, ToggledButton} from "../components/Button";
import { CREATE_BALL } from '../api/mutations/balls.mutations';


const styles = StyleSheet.create({
    item: {
        padding: 30,
        paddingTop: 0,
        marginBottom: 10,
        width: '100%',
        backgroundColor: '#FFFFFF',
    },

    textAndPreview: {
        flexDirection: 'row',
        marginTop: 5,
    },

    preview: {
        flex: 1,
        width: 100,
        height: 80,
        borderRadius: 10,
    },

    threadTitle: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 15
    },

    allText: {
        flex: 2,
    },

    threadText: {
        color: 'black',
        fontSize: 15
    },

    creatorText: {
        color: '#B0B0B0',
        fontSize: 13,
        marginBottom: 7,
        marginTop: 5
    },
    linkText: {
        color: appColors.lightPrimary,
    },

    balls: {
        flex: 1,
    }

});

export const TimelineItem = ({ item }: { item: ThreadModel }) => {
    const [performBall, { data: ballData, loading: ballLoading }] = useMutation<{ createBall: Boolean }>(CREATE_BALL);

    const renderPreview = () => {
        if (item.assetMetadata) {
            return <Urls urls={[item.assetMetadata!]} user={{}} />
        }
    };
    const renderImageInfo = (item: ThreadModel) => {
        if (item.assetMetadata)
            return <Image style={[styles.preview]} source={{ uri: item.assetMetadata.image }} />;
        else
            return;
    };
    const showLink = (item: ThreadModel) => {
        if (item.type == ContentType.LINK && item.assetUrl)
            return <Text
                style={[styles.linkText]}
                onPress={() => Linking.openURL('www.google.com')}
            >
                {item.assetUrl}
            </Text>;
        else
            return;
    };
    const showDate = (item: ThreadModel) => {
        moment.locale();
        if (item.updatedAt) {
            return <Text>{moment(item.updatedAt).fromNow()}</Text>
        }
        return <Text>{moment(item.createdAt).fromNow()}</Text>

    }
    const checkUpdated = (item: ThreadModel) => {
        if (item.updatedAt) {
            return <Text>aangepast</Text>
        }
        else {
            return <Text>aangemaakt</Text>
        }
    }
    // This one works
    const { data } = useQuery<{ getBallsForThread: BallModel }>(BallQueries.BALLS, {
        variables: {
            threadId: item._id!
        },
        fetchPolicy: "cache-and-network"
    });

    const onBallPress = async () => {
        await performBall({
            variables: {
                threadId: item._id!
            }
        });
    };

    // WIP
    const unlikePress = () => {
        alert("not supported yet");
    }
    
    // This one works
    const renderBallButton = () => {
        if(data!.getBallsForThread.ballByUser) {
            return <ToggledButton title={data!.getBallsForThread.total!.toString()} onPress={unlikePress}/>
        } else {
            return <Button title={data!.getBallsForThread.total!.toString()} onPress={onBallPress} />
        }
    }

    return <View style={[styles.item]}>
        <Text style={[styles.creatorText]}>{item.createdByUserId}  ●  {showDate(item)} {checkUpdated(item)}.</Text>
        <Text style={[styles.creatorText]}>{item.type}</Text>
        {/* <Text>{renderLinkInfo(item)}</Text> */}
        <View style={[styles.textAndPreview]}>
            <View style={[styles.allText]}>
                <Text style={[styles.threadTitle]}>{item.title}</Text>
                <Text style={[styles.threadText]}>{item.description}</Text>
                <Text style={[styles.threadText]}>{item.type}</Text>
                {showLink(item)}

            </View>
            {renderImageInfo(item)}

            {/* <Image style={[styles.preview]} source={require('../assets/images/voetbalpreview.jpg')} /> */}
        </View>
        {renderPreview()}
        <View style={[styles.balls]}>
            <Text> ● {data!.getBallsForThread.total}</Text>
        </View>
        {renderBallButton()}
    </View>

};
