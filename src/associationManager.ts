import {
  Range,
  TextEditor,
} from 'vscode'

import {Association} from './association'
import {Match} from './documentScanner'

export class AssociationManager {
  private activeAssociations: Map<string, Association>

  constructor() {
    this.activeAssociations = new Map()
  }

  public createAssociation = (
    letter: string, 
    match: Match,
    textEditor: TextEditor
  ) => {
    const {lineIndex, matchStartIndex, matchEndIndex} = match
    const range = new Range(lineIndex, matchStartIndex, lineIndex, matchEndIndex)
    const association = new Association(letter, range)

    this.activeAssociations.set(letter, association)
    textEditor.setDecorations(association.getDecoration(), [range])
  }

  public hasAssociation = (letter: string) => {
    return this.activeAssociations.has(letter)
  }

  public getAssociation = (letter: string): Association | undefined => {
    return this.activeAssociations.get(letter)
  }

  public dispose = () => {
    this.activeAssociations.forEach((association) => association.dispose())
    this.activeAssociations = new Map()
  }
}
