import {
  TextEditorDecorationType as TextDecoration,
  Range,
  window,
  ThemeColor,
} from 'vscode'

class Association {
  private decoration: TextDecoration
  private range: Range

  constructor(letter: string, range: Range) {
    this.decoration = this.createDecoration(letter)
    this.range = range
  }

  private createDecoration = (letter: string) => {
    return window.createTextEditorDecorationType({
      backgroundColor: new ThemeColor('editor.wordHighlightBackground'),
      before: {
        contentText: this.addIconIfUppercase(letter),
        margin: '0 5px 0 5px',
        backgroundColor: new ThemeColor('findThenJump.textDecorationBackground'),
        border: '3px solid',
        color: new ThemeColor('findThenJump.textDecorationForeground'),
        borderColor: new ThemeColor('findThenJump.textDecorationBackground'),
      },
    })
  }
  
  private addIconIfUppercase = (letter: string): string => {
    const lowercaseLetter = letter.toLowerCase()

    return letter !== lowercaseLetter
      ? '⇧' + lowercaseLetter
      : letter
  }

  public getDecoration = (): TextDecoration => {
    return this.decoration
  }

  public getRange = (): Range => {
    return this.range
  }

  public dispose = () => {
    this.decoration.dispose()
  }
}

export {Association}