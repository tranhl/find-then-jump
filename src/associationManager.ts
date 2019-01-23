import {
  Range,
  TextEditor,
} from 'vscode'

import {Association} from './association'
import {Match} from './controller'

export class AssociationManager {
  private activeAssociations: Map<string, Association>

  constructor() {
    this.activeAssociations = new Map()
  }

  public createAssociation = (
    letter: string, 
    {index: matchIndex, value: match}: {index: number, value: Match},
    textEditor: TextEditor
  ) => {
    const range = new Range(matchIndex, match.start, matchIndex, match.end)
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
