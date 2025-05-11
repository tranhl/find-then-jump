import type { TextDocument } from "vscode";
import { type ExtensionConfiguration, getConfiguration } from "./configuration";

type Match = {
	lineIndex: number;
	matchStartIndex: number;
	matchEndIndex: number;
	excludedChars: string[];
};

enum ScanDirection {
	Up = 0,
	Down = 1,
}

type ScannerState = {
	scanDirection: ScanDirection;
	initialLineNumber: Readonly<number>;
	upperLineNumber: number;
	lowerLineNumber: number;
	upperLineBoundary: Readonly<number>;
	lowerLineBoundary: Readonly<number>;
};

class DocumentScanner implements IterableIterator<Match> {
	// When generating a list of valid jump characters, there are cases where
	// the user continues typing, expecting to narrow down their search, but
	// accidentally trigger a jump instead. By excluding letters ahead of the
	// search match, we can prevent this from happening. This value was chosen
	// through trial and error, and prevents the above case from happening _most_
	// of the time.
	static EXCLUSION_LOOKAHEAD_LENGTH = 8;
	static ITERATION_LIMIT = 200;
	static NON_ALPHABETS: RegExp = /[^a-z]/gi;
	static WORD_START: RegExp = /^([^a-zA-Z]|[a-z][A-Z])/g;

	readonly document: TextDocument;
	scannerState: ScannerState;
	iterationOrder: number[];
	documentIterator: Iterator<Match>;
	configuration: ExtensionConfiguration;

	constructor(
		document: Readonly<TextDocument>,
		initialLineNumber: number,
		needle: string,
	) {
		this.document = document;
		this.scannerState = {
			scanDirection: ScanDirection.Down,
			initialLineNumber,
			upperLineNumber: initialLineNumber,
			lowerLineNumber: initialLineNumber,
			upperLineBoundary: 0,
			lowerLineBoundary: document.lineCount - 1,
		};

		// We want jump option updates to be as responsive as possible while the
		// user is typing, so we optimize this by generating the order of lines that
		// the scanner will go through while the extension is loading (it loads
		// every time the keyboard shortcut is activated). This greatly simplifies
		// the matching algorithm while the user is typing.
		this.configuration = getConfiguration();
		this.iterationOrder = this.generateIterationOrder();
		this.documentIterator = this.createDocumentIterator(needle);
	}

	private generateIterationOrder = (): number[] => {
		// Pre-load iteration order with first line, a minor optimization
		const iterationOrder: number[] = [this.scannerState.initialLineNumber];
		const documentLineCount = this.document.lineCount;

		// The cursor might already be at a boundary (i.e. at the very top or bottom),
		// so we check for that first before entering the main generation loop,
		// and update the scanner's boundary state to reflect that.
		this.updateScannerBoundaryState();

		while (this.shouldContinueScanning(iterationOrder, documentLineCount)) {
			this.generateNextIteration(iterationOrder);
		}

		return iterationOrder;
	};

	private updateScannerBoundaryState = () => {
		if (
			this.scannerState.upperLineNumber <= this.scannerState.upperLineBoundary
		) {
			this.scannerState.scanDirection = ScanDirection.Down;
		}

		if (
			this.scannerState.lowerLineNumber >= this.scannerState.lowerLineBoundary
		) {
			this.scannerState.scanDirection = ScanDirection.Up;
		}
	};

	private shouldContinueScanning = (
		iterationOrder: number[],
		documentLineCount: number,
	): boolean => {
		const outOfLinesToScan =
			iterationOrder.length >= documentLineCount || documentLineCount === 1;
		const atIterationLimit =
			iterationOrder.length >= DocumentScanner.ITERATION_LIMIT;

		return !outOfLinesToScan && !atIterationLimit;
	};

	private generateNextIteration = (iterationOrder: number[]): void => {
		const nextLineNumber = this.shiftCursorAndReverseScanDirection();
		iterationOrder.push(nextLineNumber);
		this.updateScannerBoundaryState();
	};

	private shiftCursorAndReverseScanDirection = (): number => {
		// We want jump options to appear as close to the user's cursor as possible,
		// since that is where the user is probably looking. To achieve this, we
		// generate the iteration order in a 'ripple' pattern originating from the
		// initial cursor position.
		//
		// i.e. We scan the line at the initial cursor position, the one below the
		// initial, the one above the initial, then two above, two below, and so on.
		if (this.scannerState.scanDirection === ScanDirection.Down) {
			this.scannerState.lowerLineNumber += 1;
			this.scannerState.scanDirection = ScanDirection.Up;

			return this.scannerState.lowerLineNumber;
		}

		this.scannerState.upperLineNumber -= 1;
		this.scannerState.scanDirection = ScanDirection.Down;

		return this.scannerState.upperLineNumber;
	};

	private *createDocumentIterator(needle: string): Iterator<Match> {
		for (const currentLine of this.iterationOrder) {
			const line = this.getLineText(currentLine);
			const haystack = line.toLowerCase();

			// It's common to have many matches for any given search term (needle) on
			// any line of text. String.prototype.indexOf() only returns the index of
			// the *first* match, so we need to keep track of this and continue the
			// search until we reach the end of the line.
			for (let needleSearchResumePosition = 0; ; ) {
				const matchStartIndex = haystack.indexOf(
					needle,
					needleSearchResumePosition,
				);
				const noMatchFound = matchStartIndex === -1;
				if (noMatchFound) break;

				if (
					this.configuration.matchBehavior === "word-start" &&
					!DocumentScanner.NON_ALPHABETS.test(needle[0])
				) {
					const isStartOfLine = matchStartIndex === 0;
					if (!isStartOfLine) {
						const matchWithPrecedingChar = line.slice(
							matchStartIndex - 1,
							matchStartIndex + needle.length,
						);
						const isWordStartLike = matchWithPrecedingChar.match(
							DocumentScanner.WORD_START,
						);
						if (!isWordStartLike) {
							needleSearchResumePosition += needle.length;
							continue;
						}
					}
				}

				const matchEndIndex = matchStartIndex + needle.length;
				needleSearchResumePosition = matchEndIndex;
				const excludedChars = this.getExcludedChars(haystack, matchEndIndex);

				yield this.createMatch(
					currentLine,
					matchStartIndex,
					matchEndIndex,
					excludedChars,
				);
			}
		}
	}

	private getLineText = (index: number): string => {
		return this.document.lineAt(index).text;
	};

	private getExcludedChars = (haystack: string, matchEndIndex: number) => {
		const haystackExclusionEndIndex =
			matchEndIndex + DocumentScanner.EXCLUSION_LOOKAHEAD_LENGTH;
		const unfilteredExcludedChars = haystack.slice(
			matchEndIndex,
			haystackExclusionEndIndex,
		);
		const filteredExcludedChars = unfilteredExcludedChars.replace(
			DocumentScanner.NON_ALPHABETS,
			"",
		);

		return [...filteredExcludedChars];
	};

	private createMatch = (
		lineIndex: number,
		matchStartIndex: number,
		matchEndIndex: number,
		excludedChars: string[],
	): Match => ({ lineIndex, matchStartIndex, matchEndIndex, excludedChars });

	public next = (): IteratorResult<Match> => {
		return this.documentIterator.next();
	};

	[Symbol.iterator](): IterableIterator<Match> {
		return this;
	}
}

export { type Match, DocumentScanner };
