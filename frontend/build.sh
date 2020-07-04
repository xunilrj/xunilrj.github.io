#! /bin/bash
npx snowpack build
cp node_modules/@fortawesome/fontawesome-free/css/all.min.css ./build/all.min.css -f
cp node_modules/magic.css/dist/magic.css ./build/magic.css -f
mkdir ./build/webfonts/
cp node_modules/@fortawesome/fontawesome-free/webfonts/* ./build/webfonts/
find build -type f -print0 | xargs -0 sed -i 's/_commonjsHelpers.*.js/common.js/g'
pushd build
mv ./web_modules/common/_commonjsHelpers*.js ./web_modules/common/common.js
rm ../../__snowpack__ -rf
rm ../../spinningcube -rf
rm ../../web_modules -rf
rm ../../webfonts -rf
mv ./* ../.. -f
popd