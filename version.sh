VERSION=$(jq '.version + 1' system.json)
jq --tab --arg version "$VERSION" '.version = ($version | tonumber) | .download |= gsub("v[0-9]+"; "v" + $version)' system.json > temp.json
mv temp.json system.json
git commit -am "Release v$VERSION"
git tag "v$VERSION"
