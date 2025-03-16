# Gmail LaTeX Render Extension

## Overview
gmTeX is a small browser extension for sending LaTeX equations over gmail.
The extension adds a "Render LaTeX" button to the toolbar, allowing you 
to format inline LaTeX expressions wrapped in `$...$`.

## Features
- Detects LaTeX expressions in the Gmail message body.
- Uses MathJax to render mathematical expressions.
- Provides a "Render LaTeX" button in Gmail's toolbar.

## Usage
1. Open Gmail and compose a new email.
2. Enter LaTeX expressions in the message body using:
   - Inline notation: `$\e^{i\pi} + 1 = 0$`
3. Click the **Render LaTeX** button in the toolbar.
4. The LaTeX expressions will be replaced inline attachments.

## Dependencies
This extension is built on top of inboxSDK(which is used by dropbox) and uses mathJax
to render LaTeX. My goal with this extension is to make it strictly client-side
as to not send any remote server(this is why images are added as attachments).

