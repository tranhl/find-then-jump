# Find Then Jump 2

> [leap.nvim](https://github.com/ggandor/leap.nvim) inspired code navigation.

This extension is fork of [find-then-jump](https://github.com/tranhl/find-then-jump) with a few modifications to better mimic leap-like motion behavior.

## Getting Started

Available keyboard shortcuts in order to use the extension: 

- `findThenJump.initiate`: Starts a jump-search without text selection.
- `findThenJump.initiateWithSelection`: Jump to a search term, selecting all text between the current cursor position and the search term.

Example in `settings.json` using [vscode-vim](https://github.com/VSCodeVim/Vim/):
```json
   "vim.normalModeKeyBindingsNonRecursive": [
      { "before": ["s"], "commands": ["findThenJump2.initiate"] },
   ]

   "vim.visualModeKeyBindings": [
      { "before": ["s"], "after": [""], "commands": ["findThenJump2.initiateWithSelection"] },
   ]
```

## Theming

You can customize the match colors displayed by adding the following in `settings.json`:

- `findThenJump.textDecorationForeground`: Controls text color of the text decoration.
- `findThenJump.textDecorationBackground`: Controls the background color of the text decoration.

Example in `settings.json`:

```json
{
    "workspace.colorCustomizations": {
        "findThenJump2.textDecorationForeground": "#FFFFFF",
        "findThenJump2.textDecorationBackground": "#000000"
    }
}
```

## Bugs & Suggestions

Feel free to create an [issue](https://github.com/tranhl/find-then-jump/issues)
outlining the bug or suggestion!

## Change Log

[See here.](CHANGELOG.md)

## Copyright

Extension icon made by [Freepik](https://www.freepik.com),
from [FlatIcon](https://www.flaticon.com),
under a [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0) license.
