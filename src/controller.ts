import { Selection, type TextEditor, type Range } from "vscode";
import { InputBox } from "./inputBox";
import { Match, DocumentScanner } from "./documentScanner";
import { AssociationManager } from "./associationManager";
import type { Association } from "./association";
import { invariant } from "./utils";

class Controller {
	static generateValidJumpChars: () => string[] = () => [
		..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
	];

	textEditor?: TextEditor;
	inputBox?: InputBox;
	associationManager: AssociationManager;
	initiated: boolean;
	initiatedWithSelection: boolean;
	inputMatches: Match[];
	availableJumpChars: string[] = Controller.generateValidJumpChars();

	constructor() {
		this.associationManager = new AssociationManager();
		this.initiated = false;
		this.initiatedWithSelection = false;
		this.inputMatches = [];
		this.availableJumpChars = Controller.generateValidJumpChars();
	}

	public initiate = (textEditor: TextEditor) => {
		if (this.initiated) {
			return;
		}

		this.textEditor = textEditor;
		this.initiated = true;

		this.inputBox = new InputBox({
			textEditor,
			onInputValueChange: this.handleInputValueChange,
			onCancel: this.resetExtensionState,
		});
	};

	public initiateWithSelection = (textEditor: TextEditor) => {
		this.initiatedWithSelection = true;
		this.initiate(textEditor);
	};

	private handleInputValueChange = (input: string, char: string) => {
		const association = this.associationManager.getAssociation(char);

		if (association) {
			this.jumpToAssociation(association);
			return;
		}

		if (input === "") {
			this.resetExtensionState();
			return;
		}

		this.displayNewJumpOptions(input);
	};

	private displayNewJumpOptions = (input: string) => {
		this.updateJumpOptions(input);

		// New user input will generate new input matches, so to avoid duplicates
		// and ensure valid jump keys, we reset all current jump associations before
		// creating new jump associations.
		this.resetJumpAssociations();
		this.createJumpAssociations();
		this.resetSearchMetadata();
	};

	private updateJumpOptions = (input: string) => {
		if (this.inputMatches.length >= this.availableJumpChars.length) return;

		const documentScanner = this.setupDocumentScanner(input);
		for (const match of documentScanner) {
			this.removeExcludedCharsFromAvailableChars(match.excludedChars);
			this.inputMatches.push(match);
		}
	};

	private setupDocumentScanner = (input: string) => {
		invariant(this.textEditor);

		const { document, selection } = this.textEditor;

		const documentScanner = new DocumentScanner(
			document,
			selection.end.line,
			input.toLowerCase(),
		);

		return documentScanner;
	};

	private removeExcludedCharsFromAvailableChars = (excludedChars: string[]) => {
		for (const excludedChar of excludedChars) {
			const lowercaseChar = excludedChar.toLowerCase();
			const uppercaseChar = excludedChar.toUpperCase();

			this.availableJumpChars = this.availableJumpChars.filter(
				(char) => ![lowercaseChar, uppercaseChar].includes(char),
			);
		}
	};

	private resetJumpAssociations = () => {
		this.associationManager.dispose();
	};

	private createJumpAssociations = () => {
		invariant(this.textEditor);

		for (const match of this.inputMatches) {
			const availableJumpChar = this.availableJumpChars.shift();
			if (!availableJumpChar) return;
			this.associationManager.createAssociation(
				availableJumpChar,
				match,
				this.textEditor,
			);
		}
	};

	private resetSearchMetadata = () => {
		this.inputMatches = [];
		this.availableJumpChars = Controller.generateValidJumpChars();
	};

	private jumpToAssociation = (association: Association) => {
		invariant(this.textEditor);

		this.textEditor.selection = this.createSelection(
			association.getSelection(),
		);
		this.resetExtensionState();
	};

	private createSelection = (range: Range) => {
		invariant(this.textEditor);

		const { line, character } = range.start;

		let anchorLine = -1;
		let anchorCharacter = -1;

		if (this.initiatedWithSelection) {
			anchorLine = this.textEditor.selection.start.line;
			anchorCharacter = this.textEditor.selection.start.character;
		} else {
			anchorLine = line;
			anchorCharacter = character;
		}

		return new Selection(anchorLine, anchorCharacter, line, character);
	};

	private resetExtensionState = () => {
		this.initiated = false;
		this.initiatedWithSelection = false;
		this.resetJumpAssociations();
		this.resetSearchMetadata();
		this.inputBox?.destroy();
	};
}

export { Match, Controller };
