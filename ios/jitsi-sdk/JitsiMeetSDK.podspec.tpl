Pod::Spec.new do |s|
  s.name             = 'JitsiMeetSDK'
  s.version          = 'VERSION'
  s.summary          = 'Jitsi Meet iOS SDK'
  s.description      = 'Jitsi Meet is a WebRTC compatible, free and Open Source video conferencing system that provides browsers and mobile applications with Real Time Communications capabilities.'
  s.homepage         = 'https://github.com/jitsi/jitsi-meet-ios-sdk-releases'
  s.license          = 'Apache 2'
  s.authors          = 'The Jitsi Meet project authors'
  s.source           = { :git => 'https://github.com/jitsi/jitsi-meet-ios-sdk-releases.git', :tag => s.version }
  s.social_media_url = 'https://twitter.com/jitsinews'

  s.platform         = :ios, '10.0'

  s.vendored_frameworks = 'Frameworks/JitsiMeet.framework', 'Frameworks/WebRTC.framework'
end
