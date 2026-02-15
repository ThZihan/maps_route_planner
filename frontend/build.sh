#!/bin/bash

BUILD_DIR="dist"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR/js $BUILD_DIR/css

# Check if build tools are installed
if ! command -v terser &> /dev/null; then
    echo "Warning: terser not found. Install with: npm install -g terser"
    echo "Copying files without minification..."
    cp js/*.js $BUILD_DIR/js/
    cp css/*.css $BUILD_DIR/css/
    cp index.html $BUILD_DIR/
else
    # Minify JavaScript
    echo "Minifying JavaScript..."
    terser js/map.js js/route.js js/animation.js -o $BUILD_DIR/js/app.min.js -c -m

    # Minify CSS
    if command -v cleancss &> /dev/null; then
        echo "Minifying CSS..."
        cleancss -o $BUILD_DIR/css/style.min.css css/style.css
    else
        echo "Warning: cleancss not found. Copying CSS without minification..."
        cp css/style.css $BUILD_DIR/css/style.min.css
    fi

    # Minify HTML
    if command -v html-minifier &> /dev/null; then
        echo "Minifying HTML..."
        html-minifier --collapse-whitespace --remove-comments \
          --minify-css true --minify-js true \
          index.html -o $BUILD_DIR/index.html
    else
        echo "Warning: html-minifier not found. Copying HTML without minification..."
        cp index.html $BUILD_DIR/
    fi
fi

echo "Build complete! Files are in: $BUILD_DIR"
