import {
  TextEditorDecorationType,
  window,
  ThemeColor,
  Range,
  TextEditor,
} from 'vscode'

import {Match} from './controller'

export class AssociationManager {
  public activeDecorations: TextEditorDecorationType[] = []
  public associations: Map<string, Range> = new Map()
  public jumpChars = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g',
    'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
    'q', 'r', 's',
    't', 'u', 'v',
    'w', 'x',
    'y', 'z',

    'A', 'B', 'C', 'D', 'E', 'F', 'G',
    'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S',
    'T', 'U', 'V',
    'W', 'X',
    'Y', 'Z',
  ]

  public createAssociation = (
    letter: string, 
    {index: matchIndex, value: match}: {index: number, value: Match},
    textEditor: TextEditor
  ) => {
    const jumpDecorationText = letter === letter.toUpperCase() ? `⇧${letter.toLowerCase()}` : letter
    const jumpDecoration = this.createJumpDecoration(jumpDecorationText)
    const range = new Range(matchIndex, match.start, matchIndex, match.end)

    this.activeDecorations.push(jumpDecoration)
    this.associations.set(letter, range)
    textEditor.setDecorations(jumpDecoration, [range])
  }

  private createJumpDecoration = (decorationText: string) => {
    return window.createTextEditorDecorationType({
      backgroundColor: new ThemeColor('editor.wordHighlightBackground'),
      before: {
        contentText: decorationText,
        margin: '0 5px 0 5px',
        backgroundColor: new ThemeColor('findThenJump.textDecorationBackground'),
        border: '3px solid',
        color: new ThemeColor('findThenJump.textDecorationForeground'),
        borderColor: new ThemeColor('findThenJump.textDecorationBackground'),
      },
    })
  }

  public dispose = () => {
    this.activeDecorations.forEach((activeDecoration) => activeDecoration.dispose())

    this.associations = new Map()
    this.activeDecorations = []
  }
}
