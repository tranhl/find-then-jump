import { workspace, WorkspaceConfiguration } from "vscode"

export interface ExtensionConfiguration extends WorkspaceConfiguration {
  matchAlgorithm: 'default' | 'word-start' | 'alpha-start'
}

let cfg = workspace.getConfiguration('findThenJump') as ExtensionConfiguration
workspace.onDidChangeConfiguration((event) => {
  if (event.affectsConfiguration('findThenJump')) {
    cfg = workspace.getConfiguration('findThenJump') as ExtensionConfiguration
  }
})

export const getConfiguration = () => cfg