import { workspace, type WorkspaceConfiguration } from "vscode";

export interface ExtensionConfiguration extends WorkspaceConfiguration {
	matchBehavior: "default" | "word-start";
}

let cfg = workspace.getConfiguration("findThenJump") as ExtensionConfiguration;
workspace.onDidChangeConfiguration((event) => {
	if (event.affectsConfiguration("findThenJump")) {
		cfg = workspace.getConfiguration("findThenJump") as ExtensionConfiguration;
	}
});

export const getConfiguration = () => cfg;
