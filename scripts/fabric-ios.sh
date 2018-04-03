# #!/bin/bash
while [ "$#" -gt 0 ]; do
  case "$1" in
    --key=*) key="${1#*=}"; shift 1;;
    --secret=*) secret="${1#*=}"; shift 1;;
    --key|--secret) echo "$1 requires an argument" >&2; exit 1;;

    -*) echo "unknown option: $1" >&2; exit 1;;
  esac
done

if [[ -z ${key} || -z ${secret} ]]
    then
    echo 'Usage: yarn fabric-ios --key="YOUR_API_KEY" --secret="YOUR_API_SECRET"'
    exit 1
fi

/usr/libexec/PlistBuddy -c "Set Fabric:APIKey ${key}" ./ios/RocketChatRN/Info.plist
echo "./Fabric.framework/run ${key} ${secret}" > ./ios/RocketChatRN/Fabric.sh