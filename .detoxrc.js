/** @type {Detox.DetoxConfig} */
module.exports = {
	testRunner: {
		args: {
			$0: 'jest',
			config: 'e2e/jest.config.js'
		},
		retries: process.env.CI ? 3 : 0
	},
	artifacts: {
		plugins: {
			screenshot: 'failing',
			video: 'failing',
			uiHierarchy: process.env.CI ? undefined : 'enabled'
		}
	},
	apps: {
		'ios.debug': {
			type: 'ios.app',
			binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Rocket.Chat Experimental.app',
			build:
				'xcodebuild -workspace ios/RocketChatRN.xcworkspace -scheme RocketChatRN -configuration Debug -destination \'generic/platform=iphonesimulator\' -derivedDataPath ios/build'
		},
		'ios.release': {
			type: 'ios.app',
			binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Rocket.Chat Experimental.app',
			build:
				'xcodebuild -workspace ios/RocketChatRN.xcworkspace -scheme RocketChatRN -configuration Release -destination \'generic/platform=iphonesimulator\' -derivedDataPath ios/build'
		},
		'android.debug': {
			type: 'android.apk',
			binaryPath: 'android/app/build/outputs/apk/experimentalPlay/debug/app-experimental-play-debug.apk',
			build:
				'cd android ; ./gradlew assembleExperimentalPlayDebug assembleExperimentalPlayDebugAndroidTest -DtestBuildType=debug ; cd -',
			reversePorts: [8081]
		},
		'android.release': {
			type: 'android.apk',
			binaryPath: 'android/app/build/outputs/apk/experimentalPlay/release/app-experimental-play-release.apk',
			build:
				'cd android ; ./gradlew assembleExperimentalPlayRelease assembleExperimentalPlayReleaseAndroidTest -DtestBuildType=release ; cd -'
		}
	},
	devices: {
		simulator: {
			type: 'ios.simulator',
			device: {
				type: 'iPhone 14'
			}
		},
		attached: {
			type: 'android.attached',
			device: {
				adbName: '.*'
			}
		},
		emulator: {
			type: 'android.emulator',
			device: {
				avdName: 'Pixel_API_31_AOSP'
			},
			headless: process.env.CI ? true : false
		}
	},
	configurations: {
		'ios.sim.debug': {
			device: 'simulator',
			app: 'ios.debug'
		},
		'ios.sim.release': {
			device: 'simulator',
			app: 'ios.release'
		},
		'android.att.debug': {
			device: 'attached',
			app: 'android.debug'
		},
		'android.att.release': {
			device: 'attached',
			app: 'android.release'
		},
		'android.emu.debug': {
			device: 'emulator',
			app: 'android.debug'
		},
		'android.emu.release': {
			device: 'emulator',
			app: 'android.release'
		}
	}
};
