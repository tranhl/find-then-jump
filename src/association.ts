import {
  TextEditorDecorationType as TextDecoration,
  Range,
  window,
  ThemeColor,
} from 'vscode'

class Association {
  private foreground: TextDecoration
  private background: TextDecoration
  private foregroundRange: Range
  private backgroundRange: Range
  private selection: Range

  constructor(letter: string, selection: Range, lineIndex: number, matchStartIndex: number) {
    this.foregroundRange = new Range(lineIndex, matchStartIndex, lineIndex, matchStartIndex)
    this.backgroundRange = new Range(lineIndex, matchStartIndex, lineIndex, matchStartIndex + 1)
    
    this.foreground = window.createTextEditorDecorationType({
      after: {
        contentText: letter,
        color: new ThemeColor('findThenJump.textDecorationForeground'),
        width: '0',
        fontWeight: '400'
      },
    })
    this.background = window.createTextEditorDecorationType({
      backgroundColor: new ThemeColor('findThenJump.textDecorationBackground'),
      opacity: '0',
      borderRadius: '2px',
    })

    this.selection = selection
  }

  public getDecorations = (): {foreground: TextDecoration, background: TextDecoration} => {
    return {
      foreground: this.foreground,
      background: this.background
    }
  }

  public getRanges = (): {foregroundRange: Range, backgroundRange: Range} => {
    return {
      foregroundRange: this.foregroundRange,
      backgroundRange: this.backgroundRange,
    }
  }

  public getSelection = (): Range => {
    return this.selection
  }

  public dispose = () => {
    this.foreground.dispose()
    this.background.dispose()
  }
}

export {Association}