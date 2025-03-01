# Gmail LaTeX Render Extension

## Overview
This is a small browser extension to make sending LaTeX equations over email easier.
The extension adds a "Render LaTeX" button to the toolbar, enabling users to format inline LaTeX expressions wrapped in `$...$`, `\[...\]`, or `\(...\)`.

## Features
- Detects LaTeX expressions in the Gmail message body.
- Uses KaTeX to render mathematical expressions.
- Provides a "Render LaTeX" button in Gmail's toolbar.

## Usage
1. Open Gmail and compose a new email.
2. Enter LaTeX expressions in the message body using:
   - Inline notation: `$E = mc^2$`
   - Block notation: `\[E = mc^2\]` or `\(E = mc^2\)`
3. Click the **Render LaTeX** button in the toolbar.
4. The LaTeX expressions will be replaced with rendered versions using KaTeX.

## Known Issues
- The extension currently does not support multi-line LaTeX rendering.
- Some Gmail updates may break the button injection; refresh Gmail if the button does not appear.
