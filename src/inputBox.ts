import {
  Disposable,
  TextEditor,
  window,
  InputBox as PlatformInputBox,
} from 'vscode'

const subscriptions: Disposable[] = []

class InputBox {
  inputBox: PlatformInputBox
  previousInputValue: string = ''

  constructor(private props: {
    textEditor: TextEditor,
    onInputValueChange(input: string, char: string): any,
    onCancel(...args: any[]): any,
  }) {
    this.inputBox = this.instantiateAndShowInputBox()
    this.subscribeToCancellationEventSources()
  }
  
  private instantiateAndShowInputBox = () => {
    const inputBox = window.createInputBox()
    inputBox.placeholder = 'Jump to...'
    inputBox.onDidChangeValue(this.handleInputValueChange)
    inputBox.onDidAccept(this.handleCancel)
    inputBox.onDidHide(this.handleCancel)
    inputBox.show()

    return inputBox
  }

  private subscribeToCancellationEventSources = () => {
    subscriptions.push(
      window.onDidChangeTextEditorSelection(this.handleCancel),
    )
  }
  
  public destroy = () => {
    this.inputBox.dispose()
    subscriptions.forEach((subscription) => subscription.dispose())
  }

  private handleInputValueChange = (newInputValue: string) => {
    const charPressed = this.wasBackspacePressed(newInputValue)
      ? this.getCharPressed(newInputValue)
      : ''
      
    this.previousInputValue = newInputValue
    this.props.onInputValueChange(this.inputBox.value, charPressed)
  }

  private wasBackspacePressed = (newInputValue: string) => {
    return this.previousInputValue.length < newInputValue.length
  }

  private getCharPressed(value: string) {
    return value.charAt(value.length - 1)
  }

  private handleCancel = () => {
    this.destroy()
    this.props.onCancel()
  }
}

export {subscriptions, InputBox}