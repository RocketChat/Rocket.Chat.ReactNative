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
        // Change ref type to View
        const viewShotRef = useRef<View>(null);

        if (!attachments || attachments.length === 0) {
            return null;
        }

        const handleShareImage = async () => {
            try {
                if (viewShotRef.current) {
                    // Use captureRef instead of capture
                    const uri = await captureRef(viewShotRef, {
                        format: 'jpg',
                        quality: 0.8,
                        result: Platform.OS === 'ios' ? 'base64' : 'data-uri'
                    });

                    let shareOptions;

                    if (Platform.OS === 'ios') {
                        shareOptions = {
                            url: `data:image/jpeg;base64,${uri}`,
                            type: 'image/jpeg',
                            failOnCancel: false
                        };
                    } else {
                        shareOptions = {
                            url: uri,
                            type: 'image/jpeg',
                            failOnCancel: false
                        };
                    }

                    await Share.open(shareOptions);
                }
            } catch (error) {
                console.error('Error capturing or sharing image:', error);
                if (error instanceof Error) {
                    console.error('Error details:', {
                        message: error.message,
                        stack: error.stack
                    });
                }
            }
        };

        const renderImage = (file: IAttachment, msg: any) => (
            // Use View instead of ViewShot and add key prop
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
                    <Video
                        key={file.video_url}
                        file={file}
                        showAttachment={showAttachment}
                        getCustomEmoji={getCustomEmoji}
                        style={style}
                        isReply={isReply}
                        author={author}
                        msg={msg}
                    />
                );
            }

            if (file && file.actions && file.actions.length > 0) {
                return <AttachedActions attachment={file} getCustomEmoji={getCustomEmoji} />;
            }

            if (typeof file.collapsed === 'boolean') {
                return (
                    <CollapsibleQuote 
                        key={index} 
                        index={index} 
                        attachment={file} 
                        timeFormat={timeFormat} 
                        getCustomEmoji={getCustomEmoji} 
                    />
                );
            }

            return (
                <Reply
                    key={index}
                    index={index}
                    attachment={file}
                    timeFormat={timeFormat}
                    getCustomEmoji={getCustomEmoji}
                    msg={msg}
                    showAttachment={showAttachment}
                />
            );
        });

        return <>{attachmentsElements}</>;
    },
    (prevProps, nextProps) => dequal(prevProps.attachments, nextProps.attachments)
);

Attachments.displayName = 'MessageAttachments';

export default Attachments;