'use strict'
import {commands, ExtensionContext} from 'vscode'
import {Controller} from './controller'
import {subscriptions as inputBoxSubscriptions} from './inputBox'

const controller = new Controller()

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerTextEditorCommand(
      'findThenJump.initiate',
      controller.initiate,
    ),
    commands.registerTextEditorCommand(
      'findThenJump.initiateWithSelection',
      controller.initiateWithSelection,
    ),
  )
}

export function deactivate() {
  const subscriptions = [...inputBoxSubscriptions]

  subscriptions.forEach(
    (subscription) => subscription.dispose(),
  )
}
