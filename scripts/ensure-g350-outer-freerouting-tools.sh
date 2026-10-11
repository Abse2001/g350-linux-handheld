#!/usr/bin/env bash
# Additional routing tool only; never replace the board's native solver pins.
set -euo pipefail
cd "$(dirname "$0")/.."
test "$(uname -m)" = x86_64
mkdir -p .cloud-tools/java25
jar=.cloud-tools/freerouting-2.5.0.jar
if [[ ! -f "$jar" ]]; then
  curl --fail --location --retry 3 https://github.com/freerouting/freerouting/releases/download/v2.5.0/freerouting-2.5.0.jar -o "$jar"
fi
echo "f6f51bb02245e8e717f9359bd260cc9c5c0b1bc0acc8b7cb2cd5b8ffeb5de3c7  $jar" | sha256sum -c -
archive=OpenJDK25U-jre_x64_linux_hotspot_25.0.2_10.tar.gz
url=https://github.com/adoptium/temurin25-binaries/releases/download/jdk-25.0.2%2B10
if [[ ! -f ".cloud-tools/java25/$archive" ]]; then
  curl --fail --location --retry 3 "$url/$archive" -o ".cloud-tools/java25/$archive"
fi
echo "d6c89e08f42be94cd55eab20190958a35b993625018a3ac59cb3d16d8445cf98  .cloud-tools/java25/$archive" | sha256sum -c -
if [[ ! -f .cloud-tools/java25/official.sha256.txt ]]; then
  curl --fail --location --retry 3 "$url/$archive.sha256.txt" -o .cloud-tools/java25/official.sha256.txt
fi
(cd .cloud-tools/java25; sha256sum -c official.sha256.txt)
if [[ ! -x .cloud-tools/java25/jdk-25.0.2+10-jre/bin/java ]]; then
  tar -xzf ".cloud-tools/java25/$archive" -C .cloud-tools/java25
fi
.cloud-tools/java25/jdk-25.0.2+10-jre/bin/java -version
# JDK is needed by the read-only pin-model audit and bounded planner adapter.
jdk_archive=OpenJDK25U-jdk_x64_linux_hotspot_25.0.2_10.tar.gz
if [[ ! -f ".cloud-tools/java25/$jdk_archive" ]]; then
  curl --fail --location --retry 3 "$url/$jdk_archive" -o ".cloud-tools/java25/$jdk_archive"
fi
echo "987387933b64b9833846dee373b640440d3e1fd48a04804ec01a6dbf718e8ab8  .cloud-tools/java25/$jdk_archive" | sha256sum -c -
if [[ ! -f .cloud-tools/java25/jdk.official.sha256.txt ]]; then
  curl --fail --location --retry 3 "$url/$jdk_archive.sha256.txt" -o .cloud-tools/java25/jdk.official.sha256.txt
fi
(cd .cloud-tools/java25; sha256sum -c jdk.official.sha256.txt)
if [[ ! -x .cloud-tools/java25/jdk-25.0.2+10/bin/javac ]]; then
  tar -xzf ".cloud-tools/java25/$jdk_archive" -C .cloud-tools/java25
fi
.cloud-tools/java25/jdk-25.0.2+10/bin/javac -version
source cloud/env.sh
XDG_STATE_HOME="$PWD/.cloud-tools/xdg-state" .cloud-tools/java25/jdk-25.0.2+10-jre/bin/java \
  -Djava.awt.headless=true -jar "$jar" --user_data_path="$PWD/.cloud-tools/freerouting-2.5-java-data" -h
