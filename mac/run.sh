#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.volta/bin:$HOME/.local/share/mise/shims:$HOME/.asdf/shims:$HOME/.fnm/aliases/default/bin:$PATH"
export LANG="${LANG:-en_US.UTF-8}"

if ! command -v node >/dev/null 2>&1 && [ -d "$HOME/.nvm/versions/node" ]; then
  NVM_NODE_DIR=$(ls -d "$HOME/.nvm/versions/node"/*/bin 2>/dev/null | sort -V | tail -n 1)
  [ -n "$NVM_NODE_DIR" ] && export PATH="$NVM_NODE_DIR:$PATH"
fi

if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display dialog "MarkPaste requires Node.js to be installed. Please install Node.js (e.g. via Homebrew or nodejs.org) and try again." buttons {"OK"} default button 1 with icon stop with title "Node.js Missing"'
  exit 1
fi

DIR="$(cd "$(dirname "$0")" && pwd)"

# Run markpaste and capture stderr
ERR_FILE=$(mktemp)
node "$DIR/app/bin/markpaste" "$@" 2>"$ERR_FILE"
STATUS=$?

if [ $STATUS -ne 0 ]; then
  ERR_MSG=$(cat "$ERR_FILE")
  # Escape double quotes for AppleScript
  ERR_MSG_ESC=$(echo "$ERR_MSG" | sed 's/"/\\"/g')
  osascript -e "display dialog \"MarkPaste failed with error:\n\n$ERR_MSG_ESC\" buttons {\"OK\"} default button 1 with icon stop with title \"MarkPaste Error\""
fi

rm -f "$ERR_FILE"
exit $STATUS
