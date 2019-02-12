# Rocket.Chat React Native Mobile

[![Greenkeeper badge](https://badges.greenkeeper.io/RocketChat/Rocket.Chat.ReactNative.svg)](https://greenkeeper.io/)
[![Build Status](https://img.shields.io/travis/RocketChat/Rocket.Chat.ReactNative/master.svg)](https://travis-ci.org/RocketChat/Rocket.Chat.ReactNative)
[![Project Dependencies](https://david-dm.org/RocketChat/Rocket.Chat.ReactNative.svg)](https://david-dm.org/RocketChat/Rocket.Chat.ReactNative)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bb15e2392a71473ea59d3f634f35c54e)](https://www.codacy.com/app/RocketChat/Rocket.Chat.ReactNative?utm_source=github.com&utm_medium=referral&utm_content=RocketChat/Rocket.Chat.ReactNative&utm_campaign=badger)
[![codecov](https://codecov.io/gh/RocketChat/Rocket.Chat.ReactNative/branch/master/graph/badge.svg)](https://codecov.io/gh/RocketChat/Rocket.Chat.ReactNative)
[![CodeFactor](https://www.codefactor.io/repository/github/rocketchat/rocket.chat.reactnative/badge)](https://www.codefactor.io/repository/github/rocketchat/rocket.chat.reactnative)
[![Known Vulnerabilities](https://snyk.io/test/github/rocketchat/rocket.chat.reactnative/badge.svg)](https://snyk.io/test/github/rocketchat/rocket.chat.reactnative)

**Supported Server Versions:** 0.66.0+

## Download
<a href="https://play.google.com/store/apps/details?id=chat.rocket.reactnative">
  <img alt="Download on Google Play" src="https://play.google.com/intl/en_us/badges/images/badge_new.png" height=43>
</a>
<a href="https://itunes.apple.com/us/app/rocket-chat-experimental/id1272915472">
  <img alt="Download on App Store" src="https://user-images.githubusercontent.com/7317008/43209852-4ca39622-904b-11e8-8ce1-cdc3aee76ae9.png" height=43>
</a>

## Beta Access

### TestFlight

You can signup to our TestFlight builds by acessing this link: https://testflight.apple.com/join/7I3dLCNT.

### Android

You can get the latest Android builds at [#react-native](https://open.rocket.chat/channel/react-native) channel.

## Reporting an Issue

[Github Issues](https://github.com/RocketChat/Rocket.Chat.ReactNative/issues) are used to track todos, bugs, feature requests, and more.

Also check the community on [open.rocket.chat](https://open.rocket.chat/channel/react-native). We'd like to help.

## Installing dependencies

Follow the [React Native Getting Started Guide](https://facebook.github.io/react-native/docs/getting-started.html) for detailed instructions on setting up your local machine for development.

## How to run
- Clone repository and install dependencies:
    ```bash
    $ git clone git@github.com:RocketChat/Rocket.Chat.ReactNative.git
    $ cd Rocket.Chat.ReactNative
    $ yarn global add react-native-cli
    $ yarn
    ```

- Run application
    ```bash
    $ yarn ios
    ```
    ```bash
    $ yarn android
    ```

### Running single server
If you don't need multiple servers, there is a branch `single-server` just for that.
Readme will guide you on how to config.

## Roadmap

### Current priorities
1) [NEW] Jitsi integration
2) [NEW] Slash Commands ([#405][i405])
3) [NEW] Read receipt ([#542][i542])
4) [Android] Group notifications by room ([#391][i391])

### To do
|    Task              | Status |
|--------------------|-----|
| [NEW] Jitsi integration            |    WIP  | |
| [NEW] Settings layout ([#396][i396])             |    ❌  |
| [NEW] Contextual bar layout ([#402][i402])             |    ❌  |
| [NEW] Slash Commands ([#405][i405])   |  ❌  |
| [Android] Group notifications by room ([#391][i391])             |    ❌  |
| Custom icons ([#210][i210])             |    ❌  |
| Share Extension ([#69][i69])          |    ❌  |
| Upload files ([#2][i2])             |    ❌  |

[i2]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/2
[i38]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/38
[i69]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/69
[i210]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/210
[i233]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/233
[i329]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/329
[i341]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/341
[i391]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/391
[i393]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/393
[i403]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/403
[i404]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/404
[i405]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/405
[i395]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/395
[i396]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/396
[i397]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/397
[i398]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/398
[i399]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/399
[i400]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/400
[i401]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/401
[i402]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/402
[i392]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/392
[i368]: https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/368
[i311]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/311
[i542]: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/542

## Features
| Feature                                                           | Status             |
|-----------------------------------------------------------------  |----------------    |
| Send message                                                  	| ✅             	|
| Authentication via Email                                      	| ✅             	|
| Authentication via Username                                   	| ✅             	|
| Authentication via LDAP                                       	| ✅             	|
| Message format: Markdown                                      	| ✅             	|
| Message format: System messages (Welcome, Message removed...) 	| ✅             	|
| Message format: links                                         	| ✅             	|
| Message format: images                                        	| ✅             	|
| Message format: replies                                       	| ✅             	|
| Message format: alias with custom message (title & text)      	| ✅             	|
| Messages list: day separation                                 	| ✅             	|
| Messages list: load more on scroll                            	| ✅             	|
| Messages list: receive new messages via subscription          	| ✅             	|
| Subscriptions list                                            	| ✅             	|
| Segmented subscriptions list: Favorites                       	|  ✅            	|
| Segmented subscriptions list: Unreads                         	|  ✅            	|
| Segmented subscriptions list: DMs                             	|  ✅            	|
| Segmented subscriptions list: Channels                        	|  ✅            	|
| Subscriptions list: update user status via subscription       	| ✅             	|
| Numbers os messages unread in the Subscriptions list          	| ✅             	|
| Status change                                                 	| ✅             	|
| Upload image                                                  	| ✅             	|
| Upload video                                                  	|  ❌            	|
| Take picture & upload it                                      	| ✅             	|
| 2FA                                                           	| ✅             	|
| Signup                                                        	| ✅             	|
| Autocomplete with usernames                                   	| ✅             	|
| Autocomplete with @all & @here                                	| ✅             	|
| Autocomplete room/channel name                                	| ✅             	|
| Upload audio                                                  	| ✅             	|
| Forgot your password                                          	| ✅             	|
| Login screen: terms of service                                	| ✅             	|
| Login screen: privacy policy                                  	| ✅             	|
| Authentication via Google                                     	| ✅             	|
| Authentication via Facebook                                   	| ✅             	|
| Authentication via Twitter                                    	| ✅             	|
| Authentication via GitHub                                     	| ✅             	|
| Authentication via GitLab                                     	| ✅             	|
| Authentication via LinkedIn                                   	| ✅             	|
| Authentication via Meteor                                     	| ✅ 	            |
| Authentication via Wordpress                                  	|  ❌            	|
| Authentication via Custom OAuth                               	|  ❌            	|
| Authentication via SAML                                       	|  ❌            	|
| Authentication via CAS                                        	|  ❌            	|
| Custom Fields on Signup                                       	|  ❌            	|
| Create channel                                                	| ✅             	|
| Search Local                                                  	| ✅             	|
| Search in the API                                             	| ✅             	|
| Settings -> About us                                          	|  ❌            	|
| Settings -> Contact us                                        	|  ❌            	|
| Settings -> License                                           	|  ❌            	|
| Settings -> App version                                       	|  ✅            	|
| Autocomplete emoji                                            	| ✅             	|
| Upload file (documents, PDFs, spreadsheets, zip files, etc)   	| ✅             	|
| Report message                                                	|  ❌            	|
| Copy message                                                  	| ✅             	|
| Pin message                                                   	| ✅             	|
| Unpin message                                                 	| ✅             	|
| Channel Info screen -> Members                                	| ✅             	|
| Channel Info screen -> Pinned                                 	| ✅             	|
| Channel Info screen -> Starred                                	| ✅             	|
| Channel Info screen -> Uploads                                	| ✅            	    |
| Star message                                                  	| ✅             	|
| Unstar message                                                	| ✅             	|
| Channel Info screen -> Topic                                  	| ✅             	|
| Channel Info screen -> Description                            	| ✅             	|
| Star a channel                                                	| ✅             	|
| Message format: videos                                        	| ✅             	|
| Message format: audios                                        	| ✅             	|
| Block user (local only)                                       	| ✅             	|
| Edit message                                                  	| ✅             	|
| Delete a message                                              	| ✅             	|
| Reply message                                                 	| ✅             	|
| Quote message                                                 	| ✅             	|
| Record Audio                                                  	| ✅             	|
| Record Video                                                  	|  ❌            	|
| Muted state                                                   	| ✅             	|
| Admin panel                                                   	|  ❌            	|
| Offline reading                                               	| ✅             	|
| Offline writing                                               	|  ❌            	|
| Edit profile                                                  	| ✅             	|
| Reactions                                                     	| ✅             	|
| Custom emojis                                                 	| ✅             	|
| Commands                                                      	|  ❌            	|
| Accessibility (Basic)                                         	| ✅             	|
| Accessibility (Medium)                                        	|  ❌            	|
| Accessibility (Advanced)                                      	|  ❌            	|
| Reply message from notification                               	|  ❌            	|
| Tap notification, go to the channel                           	| ✅             	|
| Deep links: Authentication                                    	| ✅             	|
| Deep links: Rooms                                             	| ✅             	|
| Draft per room                                                	|  ❌            	|
| Localized in Portuguese (pt-BR)                               	| ✅             	|
| Localized in Russian                                          	| ✅             	|
| Localized in English                                          	| ✅                 |
| Full name setting                                             	|  ✅            	|
| Read only rooms                                               	| ✅             	|
| Typing status                                                 	| ✅             	|
| Create channel/group                                          	| ✅             	|
| Disable registration setting                                  	| ✅             	|
| Unread red line indicator on message list                     	| ✅             	|
| Unread counter banner on message list                         	| ✅             	|
| Share Extension                                               	|  ❌            	|
| Search Messages in Channel                                    	| ✅             	|
| Mentions List                                                 	| ✅             	|
| Attachment List                                               	| ✅             	|
| Notifications Preferences                                     	| ✅             	|
| Read receipt                                                  	|  ❌            	|

## Detox (end-to-end tests)
- Build your app

```bash
$ detox build
```

- Run tests

```bash
$ detox test
```

## Storybook
- General requirements
    - Install storybook
        ```bash
        $ yarn global add @storybook/cli
        ```

- Running storybook
    - Run storybook application
        ```bash
        $ yarn storybook
        ```
    - Run application in other shell
        ```bash
        $ react-native run-ios
        ```
    - Running storybook on browser to help stories navigation
        ```
        open http://localhost:7007/
        ```
