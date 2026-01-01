#!/bin/bash

# Test script for pbcopyhtml

TEST_CONTENT='<h1>Multi-line Test</h1>
<p>Line 1: <b>Bold</b></p>
<p>Line 2: <i>Italic</i></p>
<div style="color: blue;">Blue Text</div>'

echo "Testing pbcopyhtml with multi-line content..."
echo "$TEST_CONTENT" | ./src/pbcopyhtml

echo "---"
echo "Verifying Plain Text flavor (via osascript):"
# Read as string
osascript -e 'get (the clipboard as string)'
echo ""

echo "---"
echo "Verifying HTML flavor presence (via osascript):"
# This will output something like «data HTML3C6831...»
HTML_DATA=$(osascript -e 'get (the clipboard as «class HTML»)')
if [[ "$HTML_DATA" == *"«data HTML"* ]]; then
    echo "SUCCESS: Found HTML data in clipboard."
    # Extract a bit of the hex and check for '<b>' (3c623e)
    # Using python to check if the hex exists in the output
    if echo "$HTML_DATA" | grep -qi "3C623E"; then
        echo "SUCCESS: Found '<b>' hex (3C623E) in HTML data."
    else
         echo "FAILURE: Could not find '<b>' hex in: ${HTML_DATA:0:100}..."
    fi
else
    echo "FAILURE: Could not find HTML data in clipboard. Output: $HTML_DATA"
fi