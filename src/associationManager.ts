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
    const selection = new Range(lineIndex, matchStartIndex, lineIndex, matchEndIndex)
    const association = new Association(letter, selection, lineIndex, matchStartIndex)
    const {foreground, background} = association.getDecorations()
    const {foregroundRange, backgroundRange} = association.getRanges()

    textEditor.setDecorations(foreground, [foregroundRange])
    textEditor.setDecorations(background, [backgroundRange])
    
    this.activeAssociations.set(letter, association)
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
