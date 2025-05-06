# Find Then Jump

> [Vim Easymotion](https://github.com/easymotion/vim-easymotion) inspired code navigation.

This extension fork of [Find-Jump](https://github.com/msafi/xvsc/tree/master/findJump) that fixes
the limitations of the original extension while adding additional functionality.

![Usage demo](/demo/demo.gif?raw=true "Usage demo")

## Getting Started

Bind the following keyboard shortcuts and you'll be ready to start using the extension: 

- `findThenJump.initiate`: Starts a jump-search without text selection.
- `findThenJump.initiateWithSelection`: Jump to a search term, selecting all text between the current cursor position and the search term.

> ℹ️ No default keybindings are provided by this extension - you'll have to bind the commands yourself.

- `findThenJump.matchAlgorithm`: Specify the algorithm used for matching text for navigation.

Available options are:

- `default`: Matches any text. (default)
- `word-start`: Matches the start of alphanumerical or special character sequences separated by whitespace.
- `alpha-start`: Matches the start of alphanumerical-only character sequences separated by whitespace.

## Theming

You can customize the colors of the text decorations that are displayed left of each text match by adding the following settings to `settings.json`:

- `findThenJump.textDecorationForeground`: Controls text color of the text decoration.
- `findThenJump.textDecorationBackground`: Controls the background color of the text decoration.

Example `settings.json`:

```json
{
    "workspace.colorCustomizations": {
        "findThenJump.textDecorationForeground": "#FFFFFF",
        "findThenJump.textDecorationBackground": "#000000"
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
