require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RocketChatMessageParser"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/RocketChat/Rocket.Chat.ReactNative"
  s.license      = package["license"]
  s.authors      = "Rocket.Chat"
  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/RocketChat/Rocket.Chat.ReactNative.git" }

  s.source_files = ["cpp/**/*.{h,hpp,cpp}"]
  s.private_header_files = ["cpp/rocketchat_message_parser_ffi.h", "cpp/MessageParserFfi.hpp"]
  s.preserve_paths = ["rust/Cargo.toml", "rust/Cargo.lock", "rust/rust-toolchain.toml", "rust/src/**/*", "scripts/build-rust-ios.sh"]
  s.frameworks = "CoreFoundation"

  s.script_phase = {
    :name => "Build Rust message parser",
    :script => 'bash "${PODS_TARGET_SRCROOT}/scripts/build-rust-ios.sh"',
    :execution_position => :before_compile,
    :always_out_of_date => "1"
  }

  s.pod_target_xcconfig = {
    "OTHER_LIBTOOLFLAGS" => '"${PODS_TARGET_SRCROOT}/rust/target/apple/${PLATFORM_NAME}/librocketchat_message_parser_ffi.a"'
  }

  load "nitrogen/generated/ios/RocketChatMessageParser+autolinking.rb"
  add_nitrogen_files(s)

  s.dependency "React-jsi"
  s.dependency "React-callinvoker"
  install_modules_dependencies(s)
end
