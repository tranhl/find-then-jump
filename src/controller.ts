import {
  Selection,
  TextEditor,
  Range,
} from 'vscode'
import {without} from 'ramda'
import {InputBox} from './inputBox'
import {createDocumentLineIterator} from './documentIterator'
import {AssociationManager} from './associationManager'

type Match = {
  start: number,
  end: number,
  excludedChars: string[],
}

class Controller {
  // When generating a list of valid jump characters, there are cases where
  // the user continues typing, expecting to narrow down their search, but
  // accidentally trigger a jump instead. By excluding letters ahead of the
  // search match, we can prevent this from happening. This value was chosen
  // through trial and error, and prevents the above case from happening.
  static EXCLUSION_LOOKAHEAD_LENGTH = 8
  static generateValidJumpChars: () => string[]
    = () => [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']

  textEditor: TextEditor | any
  inputBox: InputBox | any
  associationManager: AssociationManager
  initiated: boolean
  initiatedWithSelection: boolean
  userInput: string
  inputMatches: { value: Match, index: number }[]
  currentLineMatches: Match[]
  availableJumpChars: string[] = Controller.generateValidJumpChars()

  constructor() {
    this.associationManager = new AssociationManager()
    this.initiated = false
    this.initiatedWithSelection = false
    this.userInput = ''
    this.inputMatches = []
    this.currentLineMatches = []
    this.availableJumpChars = Controller.generateValidJumpChars()
  }

  public initiate = (textEditor: TextEditor) => {
    if (this.initiated) {
      return
    }

    this.textEditor = textEditor
    this.initiated = true

    this.inputBox = new InputBox({
      textEditor,
      onInputValueChange: this.handleInputValueChange,
      onCancel: this.resetExtensionState,
    })
  }

  public initiateWithSelection = (textEditor: TextEditor) => {
    this.initiatedWithSelection = true
    this.initiate(textEditor)
  }

  private handleInputValueChange = (input: string, char: string) => {
    if (this.associationManager.associations.has(char)) {
      this.jumpToCharAndCreateSelection(char)
      return
    }

    if (input === '') {
      this.resetExtensionState()
      return
    }

    this.userInput = input
    this.updateJumpPossibilities()
  }
  
  private updateJumpPossibilities = () => {
    this.updateInputMatchesAndAvailableJumpChars()

    // New user input will generate new input matches, so to avoid duplicates
    // and ensure valid jump keys, we reset all current jump associations before
    // creating new jump associations.
    this.resetJumpAssociations()
    this.createJumpAssociations()
    this.resetSearchMetadata()
  }

  private updateInputMatchesAndAvailableJumpChars = () => {
    const {document, selection} = this.textEditor
    const documentLineIterator = createDocumentLineIterator(document, selection.end.line)

    for (const {index: lineIndex, line} of documentLineIterator) {
      const needle = this.userInput.toLowerCase()
      const haystack = line.text.toLowerCase()
      this.updateInputMatches(lineIndex, needle, haystack)
    }
  }

  private updateInputMatches = (
    lineIndex: number,
    needle: string,
    haystack: string
  ) => {
    for (let needleSearchIndex = 0;;) {
      if ((needleSearchIndex = haystack.indexOf(needle, needleSearchIndex)) === -1) return
      if (this.inputMatches.length > this.availableJumpChars.length) return

      const matchStartIndex = needleSearchIndex
      const matchEndIndex = needleSearchIndex + needle.length
      const excludedChars = this.getExcludedChars(haystack, matchEndIndex)
      const match = {start: matchStartIndex, end: matchEndIndex, excludedChars}

      this.inputMatches.push({index: lineIndex, value: match})
      this.removeExcludedCharsFromAvailableChars(excludedChars)

      needleSearchIndex = matchEndIndex
    }
  }

  private getExcludedChars = (haystack: string, matchEndIndex: number) => {
    const haystackExclusionEndIndex = matchEndIndex + Controller.EXCLUSION_LOOKAHEAD_LENGTH
    const haystackExclusionLookahead = haystack.slice(matchEndIndex, haystackExclusionEndIndex)
    const filteredHaystackExclusionLookahead = haystackExclusionLookahead.replace(/[^a-z]/gi, '')

    return [...filteredHaystackExclusionLookahead]
  }

  private removeExcludedCharsFromAvailableChars = (excludedChars: string[]) => {
    for (const excludedChar of excludedChars) {
      const lowercaseChar = excludedChar.toLowerCase()
      const uppercaseChar = excludedChar.toUpperCase()

      this.availableJumpChars = without([lowercaseChar, uppercaseChar], this.availableJumpChars)
    }
  }

  private resetJumpAssociations = () => {
    this.associationManager.dispose()
  }

  private resetSearchMetadata = () => {
    this.inputMatches = []
    this.currentLineMatches = []
    this.availableJumpChars = Controller.generateValidJumpChars()
  }

  private createJumpAssociations = () => {
    if (this.availableJumpChars.length === 0) return

    for (let i = 0; i < this.inputMatches.length; i += 1)  {
      const match = this.inputMatches[i]
      const availableJumpChar = this.availableJumpChars[i]
      this.associationManager.createAssociation(availableJumpChar, match, this.textEditor)
    }
  }

  private jumpToCharAndCreateSelection = (char: string) => {
    const range = this.associationManager.associations.get(char)
    if (!range) return // This should never be the case -- line included to keep TypeScript happy.
    this.textEditor.selection = this.createSelection(range)
    this.resetExtensionState()
  }

  private createSelection = (range: Range) => {
    const {line, character} = range.start

    return new Selection(
      this.initiateWithSelection ? this.textEditor.selection.start.line : line,
      this.initiatedWithSelection ? this.textEditor.selection.start.character : character,
      line,
      character,
    )
  }

  private resetExtensionState = () => {
    this.initiated = false
    this.initiatedWithSelection = false
    this.userInput = ''
    this.resetJumpAssociations()
    this.resetSearchMetadata()
  }
}

export {Match, Controller}