#!/bin/bash

# Function to display usage
usage() {
    echo "Usage: $0 [-i] <pattern> [directory]"
    echo "  -i    Perform a case-improved search"
    echo "  pattern  The text or part of a word to search for"
    echo "  directory  The directory to search in (default: current directory)"
    exit 1
}

# Default values
IGNORE_CASE=""
PATTERN=""
SEARCH_DIR="."

# Parse options
while getopts "i" opt; do
    case $opt in
        i) IGNORE_CASE="-i" ;;
        *) usage ;;
    esac
done

# Shift arguments so that the pattern and directory are easy to access
shift $((OPTIND - 1))

# Check if pattern is provided
if [ -z "$1" ]; then
    usage
fi

PATTERN="$1"
# If a second argument is provided, it's the directory
if [ -n "$2" ]; then
    SEARCH_DIR="$2"
fi

# Check if the directory exists
if [ ! -d "$SEARCH_DIR" ]; then
    echo "Error: Directory '$SEARCH_DIR' does not exist."
    exit 1
fi

# Perform the search using grep
# -r: recursive
# -n: show line numbers
# -H: show filenames
grep -r $IGNORE_CASE -n -H "$PATTERN" "$SEARCH_DIR" 2>/dev/null

# Check if grep found anything
if [ $? -ne 0 ]; then
    echo "No matches found for '$PATTERN' in '$SEARCH_DIR'."
fi
