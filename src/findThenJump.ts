import {
  Selection,
  TextEditor,
  TextLine,
  Range,
} from 'vscode'
import {InputBox} from './inputBox'
import {documentRippleScanner} from './documentRippleScanner'
import {AssociationManager} from './associationManager'

type Match = { start: number, end: number, excludedChars: string[] }

export class FindThenJump {
  textEditor: TextEditor | any
  inputBox: InputBox | any
  associationManager = new AssociationManager()
  initiated = false
  initiatedWithSelection = false
  userInput: string = ''

  public initiate = (textEditor: TextEditor) => {
    if (this.initiated) {
      return
    }

    this.textEditor = textEditor
    this.initiated = true

    this.inputBox = new InputBox({
      textEditor,
      onInputValueChange: this.handleInputValueChange,
      onCancel: this.reset,
    })
  }

  public initiateWithSelection = (textEditor: TextEditor) => {
    this.initiatedWithSelection = true
    this.initiate(textEditor)
  }

  private handleInputValueChange = (input: string, char: string) => {
    if (this.associationManager.associations.has(char)) {
      this.jump(char)
      return
    }

    if (input === '') {
      this.reset()
      return
    }

    this.userInput = input
    this.performSearch()
  }
  
  private performSearch = () => {
    const {matches, availableJumpChars} = this.getMatchesAndAvailableJumpChars()

    if (matches.length > 0) {
      this.associationManager.dispose()
    }

    for (let i = 0; i < matches.length; i++) {
      if (availableJumpChars[i] === undefined) {
        break
      }

      const match = matches[i]
      const availableJumpChar = availableJumpChars[i]
      const {index, value} = match
      const range = new Range(index, value.start, index, value.end)

      this.associationManager.createAssociation(availableJumpChar, range, this.textEditor)
    }
  }

  private getMatchesAndAvailableJumpChars = () => {
    const {document, selection} = this.textEditor
    const documentIterator = documentRippleScanner(document, selection.end.line)
    const availableJumpChars = [...this.associationManager.jumpChars]
    const matches: { value: Match, index: number }[] = []

    outer: for (const {line, index} of documentIterator) {
      const lineMatches = this.getLineMatches(line)

      for(const lineMatch of lineMatches) {
        if (matches.length >= availableJumpChars.length) {
          break outer
        }

        matches.push({value: lineMatch, index})

        for(const excludedChar of lineMatch.excludedChars) {
          for (let i = 0; i < 2; i++) {
            const method = i === 0 ? 'toLowerCase' : 'toUpperCase'
            const indexOfExcludedChar = availableJumpChars.indexOf(excludedChar[method]())

            if (indexOfExcludedChar !== -1) {
              availableJumpChars.splice(indexOfExcludedChar, 1)
            }
          }
        }
      }
    }

    return {matches, availableJumpChars}
  }

  private getLineMatches = (line: TextLine): Match[] => {
    const indexes = []
    const {text} = line
    const haystack = text.toLowerCase()
    const needle = this.userInput.toLowerCase()

    let index = 0
    let iterationNumber = 0
    while (
      (index = haystack.indexOf(needle, iterationNumber === 0 ? 0 : index + needle.length)) !== -1
    ) {
      const start = index
      const end = index + needle.length
      const excludedChars = haystack.slice(end, end + 8).replace(/[^a-z]/gi, '').split('')
      indexes.push({start, end, excludedChars})
      iterationNumber++
    }

    return indexes
  }

  private jump = (jumpChar: string) => {
    const range = this.associationManager.associations.get(jumpChar)

    if (!range) {
      return
    }

    const {line, character} = range.start

    this.textEditor.selection = new Selection(
      this.initiatedWithSelection ? this.textEditor.selection.start.line : line,
      this.initiatedWithSelection ? this.textEditor.selection.start.character : character,
      line,
      character,
    )

    this.reset()
  }

  private reset = () => {
    this.initiated = false
    this.initiatedWithSelection = false
    this.userInput = ''
    this.associationManager.dispose()
  }
}
