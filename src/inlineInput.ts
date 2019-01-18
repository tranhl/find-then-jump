import {
  StatusBarItem,
  StatusBarAlignment,
  commands,
  Disposable,
  window,
  TextEditor,
} from 'vscode'

const cancellationChars = new Set('\n')
export const subscriptions: Disposable[] = []

export class InlineInput {
  statusBarItem: StatusBarItem
  input = ''

  constructor(private props: {
    textEditor: TextEditor,
    onInput(input: string, char: string): any,
    onBackspace(input: string): any,
    onCancel(...args: any[]): any,
  }) {
    subscriptions.push(
      commands.registerCommand('type', this.onInput),
      commands.registerTextEditorCommand('findThenJump.input.backspace', this.onBackspace),
      commands.registerTextEditorCommand('findThenJump.input.cancel', this.onCancel),
      window.onDidChangeTextEditorSelection(this.onCancel),
    )

    this.setFindThenJumpInitiatedContext(true)
    this.statusBarItem = window.createStatusBarItem(
      StatusBarAlignment.Right,
      1000,
    )
  }

  public updateStatusBar = (text: string) => {
    this.statusBarItem.text = text
    this.statusBarItem.show()
  }

  public destroy = () => {
    this.setFindThenJumpInitiatedContext(false)
    this.statusBarItem.dispose()
    subscriptions.forEach((subscription) => subscription.dispose())
  }

  private onInput = ({text}: {text: string}) => {
    const char = text

    this.input += char

    if (cancellationChars.has(char)) {
      this.onCancel()
    } else {
      return this.props.onInput(this.input, char)
    }
  }

  private onBackspace = () => {
    const {input} = this
    const inputLength = input.length

    this.input = inputLength !== 1
      ? input.substring(0, inputLength - 1)
      : ''

    return this.props.onBackspace(this.input)
  }

  private onCancel = (...args: any[]) => {
    this.destroy()
    return this.props.onCancel(args)
  }

  private setFindThenJumpInitiatedContext = (isInitiated: boolean) => {
    commands.executeCommand('setContext', 'findThenJumpInitiated', isInitiated)
  }
}
