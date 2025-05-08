# Find Then Jump

> [Vim Easymotion](https://github.com/easymotion/vim-easymotion) inspired code navigation.

This extension fork of [Find-Jump](https://github.com/msafi/xvsc/tree/master/findJump) that fixes
the limitations of the original extension while adding additional functionality.

![Usage demo](/demo/demo.gif?raw=true "Usage demo")

## Getting Started

> [!IMPORTANT]
> No default keybindings are provided by this extension.

To get started, create keybindings for the following commands:

- `findThenJump.initiate`: Starts a jump-search without text selection.
- `findThenJump.initiateWithSelection`: Jump to a search term, selecting all text between the current cursor position and the search term.

Once done, you'll be able to trigger the extension with the configured keybindings.
An input box will appear where you can type your search term. Matches in the document
will be annotated with an annotation containing a letter. Typing this letter will
move your cursor to the annotation's location.

## Configuration

### `findThenJump.matchBehavior`

Use this setting to restrict the location of matches within the document.

#### Options

- `default`: No restrictions on the location of matches within the document.
   ```ts
   const fooBar = ''

   // Input: `foo` -> ✅
   // Input: `bar` -> ✅
   // Input: `Bar` -> ✅
   // Input: `oo` -> ✅
   ```

- `word-start`: Restrict matches for alpha-numerical search terms to the start of words.
   ```ts
   const fooBar = ''

   // Input: `foo` -> ✅
   // Input: `bar` -> ✅
   // Input: `Bar` -> ✅
   // Input: `oo` -> ❌
   ```

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
