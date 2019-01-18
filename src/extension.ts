'use strict'
import {commands, ExtensionContext} from 'vscode'
import {FindThenJump} from './findThenJump'
import {subscriptions as inlineInputSubscriptions} from './inputBox'

const findThenJump = new FindThenJump()

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerTextEditorCommand(
      'findThenJump.initiate',
      findThenJump.initiate,
    ),
    commands.registerTextEditorCommand(
      'findThenJump.initiateWithSelection',
      findThenJump.initiateWithSelection,
    ),
  )
}

export function deactivate() {
  const subscriptions = [...inlineInputSubscriptions]

  subscriptions.forEach(
    (subscription) => subscription.dispose(),
  )
}
