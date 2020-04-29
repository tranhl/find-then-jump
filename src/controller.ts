import {
  Selection,
  TextEditor,
  Range,
} from 'vscode'
import {without} from 'ramda'
import {InputBox} from './inputBox'
import {Match, DocumentScanner} from './documentScanner'
import {AssociationManager} from './associationManager'
import {Association} from './association'

class Controller {
  static generateValidJumpChars: () => string[]
    = () => [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']

  textEditor: TextEditor | any
  inputBox: InputBox | any
  associationManager: AssociationManager
  documentScanner: DocumentScanner | any
  initiated: boolean
  initiatedWithSelection: boolean
  inputMatches: Match[]
  availableJumpChars: string[] = Controller.generateValidJumpChars()

  constructor() {
    this.associationManager = new AssociationManager()
    this.initiated = false
    this.initiatedWithSelection = false
    this.inputMatches = []
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
    const association = this.associationManager.getAssociation(char)

    if (association) {
      this.jumpToAssociation(association)
      return
    }

    if (input === '') {
      this.resetExtensionState()
      return
    }
    
    this.displayNewJumpOptions(input)
  }
  
  private displayNewJumpOptions = (input: string) => {
    this.updateJumpOptions(input)

    // New user input will generate new input matches, so to avoid duplicates
    // and ensure valid jump keys, we reset all current jump associations before
    // creating new jump associations.
    this.resetJumpAssociations()
    this.createJumpAssociations()
    this.resetSearchMetadata()
  }

  private updateJumpOptions = (input: string) => {
    this.setupDocumentScanner(input)

    for (const match of this.documentScanner) {
      if (this.inputMatches.length >= this.availableJumpChars.length) return

      this.removeExcludedCharsFromAvailableChars(match.excludedChars)
      this.inputMatches.push(match)
    }
  }

  private setupDocumentScanner = (input: string) => {
    const {document, selection} = this.textEditor
    
    this.documentScanner = new DocumentScanner(
      document,
      selection.end.line,
      input.toLowerCase()
    )
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

  private createJumpAssociations = () => {
    for (const match of this.inputMatches) {
      const availableJumpChar = this.availableJumpChars.shift()
      if (!availableJumpChar) return
      this.associationManager.createAssociation(availableJumpChar, match, this.textEditor)
    }
  }

  private resetSearchMetadata = () => {
    this.inputMatches = []
    this.availableJumpChars = Controller.generateValidJumpChars()
  }

  private jumpToAssociation = (association: Association) => {
    this.textEditor.selection = this.createSelection(association.getSelection())
    this.resetExtensionState()
  }

  private createSelection = (range: Range) => {
    const {line, character} = range.start

    return new Selection(
      this.initiatedWithSelection ? this.textEditor.selection.start.line : line,
      this.initiatedWithSelection ? this.textEditor.selection.start.character : character,
      line,
      character,
    )
  }

  private resetExtensionState = () => {
    this.initiated = false
    this.initiatedWithSelection = false
    this.resetJumpAssociations()
    this.resetSearchMetadata()
    this.inputBox.destroy()
  }
}

export {Match, Controller}