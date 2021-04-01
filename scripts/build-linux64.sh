#!/bin/bash

# env
CLEEPDESKTOPPATH=packaging/cleepdesktop_tree

# clear previous process
/bin/rm -rf dist/
/bin/rm -rf packaging/

# create dirs
/bin/mkdir -p "$CLEEPDESKTOPPATH"

# pyinstaller
echo
echo
echo "Packaging cleepdesktopcore..."
echo "-----------------------------"
/usr/bin/python3 -m pip install -r requirements.txt
/bin/cp config/cleepdesktopcore-linux64.spec cleepdesktopcore-linux64.spec
pyinstaller --workpath packaging --clean --noconfirm --noupx --debug all --log-level INFO cleepdesktopcore-linux64.spec
/bin/rm cleepdesktopcore-linux64.spec
/bin/mv dist/cleepdesktopcore "$CLEEPDESKTOPPATH"

# electron
echo
echo
echo "Building electron app..."
echo "------------------------"
npm ci
node_modules/.bin/tsc --outDir "$CLEEPDESKTOPPATH"
echo "Done"

# copy files and dirs
echo
echo
echo "Copying release files..."
echo "------------------------"
/bin/cp -a html "$CLEEPDESKTOPPATH"
/bin/cp -a resources "$CLEEPDESKTOPPATH"
/bin/cp -a LICENSE.txt "$CLEEPDESKTOPPATH"
/bin/cp -a package.json "$CLEEPDESKTOPPATH"
/bin/cp -a README.md "$CLEEPDESKTOPPATH"
echo "Done"

# electron-builder
echo
echo
if [ "$1" == "publish" ]
then
    echo "Publishing cleepdesktop..."
    echo "--------------------------"
    GH_TOKEN=$GH_TOKEN_CLEEPDESKTOP node_modules/.bin/electron-builder --linux --x64 --projectDir "$CLEEPDESKTOPPATH" --publish always
else
    echo "Packaging cleepdesktop..."
    echo "-------------------------"
    node_modules/.bin/electron-builder --linux --x64 --projectDir "$CLEEPDESKTOPPATH"
fi

#cleaning
echo
echo
echo "Finalizing..."
echo "-------------"
/bin/sleep 1
/bin/mv "./$CLEEPDESKTOPPATH/dist" dist
/bin/rm -rf packaging
/bin/rm -rf __pycache__
/bin/rm -rf core/__pycache__
/bin/rm -rf core/libs/__pycache__
/bin/rm -rf core/modules/__pycache__
echo "Done"

echo
echo "Build result in dist/ folder"
