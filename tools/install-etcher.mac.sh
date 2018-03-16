#!/bin/sh

#params:
# $1 : archive fullpath
# $2 : application path
# $3 : install path

/bin/rm -rf "$3/etcher-cli"
/usr/bin/tar xzf "$1" -C "$3"
/bin/rm "$1"
/bin/ls -1 "$3" | /usr/bin/grep "Etcher-cli*" | /usr/bin/awk -v app_path="$2" -v install_path="$3" '{ system("/bin/mv \""install_path"/"$1"\" \""install_path"/etcher-cli\"") }'
/bin/cp "$2/tools/flash.mac.sh" "$3/etcher-cli/flash.sh"
