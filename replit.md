# Psych Character To V-Slice Converter

## Overview
A web application and command-line tool that converts Psych Engine character JSON files to V-Slice compatible character JSON files.

## Web Application
The main interface is a web application where users can:
1. Upload a Psych Engine character JSON file
2. Enter the character name
3. Convert and either copy or download the V-Slice JSON

## Project Architecture
- **Web Frontend**: HTML/CSS/JavaScript (static files in `web/`)
- **Web Server**: Python HTTP server (`server.py`)
- **CLI Tool**: Haxe (compiles to C++)

## File Structure
```
├── web/
│   ├── index.html       # Main web interface
│   ├── styles.css       # Styling
│   └── converter.js     # Conversion logic in JavaScript
├── server.py            # Python web server
├── src/
│   └── Main.hx          # CLI tool source code (Haxe)
├── build.hxml           # Haxe build configuration
├── PostBuild.hx         # Post-build script
├── output/bin/          # Compiled CLI binary
└── project_files/       # Project assets
```

## Running the Web App
Run `python server.py` to start the web server on port 5000.

## Building the CLI Tool
Run `haxe build.hxml` to compile. The output executable will be in `output/bin/`.

## Conversion Modes
- **PSYCH_TO_VSLICE**: Converts Psych Engine character JSON to V-Slice format

## Notes
- Multi-sparrow Psych characters are not supported for conversion
- The web app performs conversion client-side (no data is sent to a server)
