import React, { useContext, useRef } from 'react';
import { dequal } from 'dequal';
import Share from 'react-native-share';
import { View, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import { Reply } from './components';
import CollapsibleQuote from './CollapsibleQuote';
import AttachedActions from './AttachedActions';
import MessageContext from '../../Context';
import { IMessageAttachments } from '../../interfaces';
import { IAttachment } from '../../../../definitions';
import { getMessageFromAttachment } from '../../utils';

const Attachments: React.FC<IMessageAttachments> = React.memo(
    ({ attachments, timeFormat, showAttachment, style, getCustomEmoji, isReply, author }: IMessageAttachments) => {
        const { translateLanguage } = useContext(MessageContext);
        const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
        const viewShotRef = useRef<View>(null);

        if (!attachments || attachments.length === 0) {
            return null;
        }

        const handleShareVideo = async (originalUrl: string, videoType: string | undefined) => {
            const videoUrl = videoUrls[originalUrl];
            
            if (!videoUrl) {
                Alert.alert('Error', 'Video URL not found');
                return;
            }

            if (typeof videoType === "undefined") {
                Alert.alert('Error', 'Invalid video type');
                return;
            }

            try {
                const shareOptions = {
                    url: videoUrl,
                    type: `video/${videoType}`,
                    failOnCancel: false
                };
                await Share.open(shareOptions);
            } catch (error) {
                console.error('Error sharing video:', error);
                Alert.alert('Error', 'Failed to share video');
            }
        };

        // ... handleShareImage remains the same

        const renderImage = (file: IAttachment, msg: any) => (
            <View
                ref={viewShotRef}
                key={file.image_url}
                style={{ backgroundColor: 'white' }}
            >
                <Image
                    onLongPress={handleShareImage}
                    file={file}
                    showAttachment={showAttachment}
                    getCustomEmoji={getCustomEmoji}
                    style={style}
                    isReply={isReply}
                    author={author}
                    msg={msg}
                />
            </View>
        );

        const attachmentsElements = attachments.map((file: IAttachment, index: number) => {
            const msg = getMessageFromAttachment(file, translateLanguage);

            if (file && file.image_url) {
                return renderImage(file, msg);
            }

            if (file && file.audio_url) {
                return (
                    <Audio
                        key={file.audio_url}
                        file={file}
                        getCustomEmoji={getCustomEmoji}
                        isReply={isReply}
                        style={style}
                        author={author}
                        msg={msg}
                    />
                );
            }

            if (file.video_url) {
                return (
                    <View key={file.video_url}>
                        <TouchableOpacity 
                            onPress={() => handleShareVideo(file.video_url!, file.video_type)}
                            style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 2 }}
                        >
                            <Text>Share</Text>
                        </TouchableOpacity>
                        <Video
                            file={file}
                            showAttachment={showAttachment}
                            getCustomEmoji={getCustomEmoji}
                            style={style}
                            isReply={isReply}
                            author={author}
                            msg={msg}
                            setUrls={setVideoUrls}
                            urls={videoUrls}
                        />
                    </View>
                );
            }

            // ... rest of the attachments handling remains the same
        });

        return <>{attachmentsElements}</>;
    },
    (prevProps, nextProps) => dequal(prevProps.attachments, nextProps.attachments)
);

Attachments.displayName = 'MessageAttachments';

export default Attachments;