import {TextDocument} from 'vscode'

type Match = {
  lineIndex: number,
  matchStartIndex: number,
  matchEndIndex: number,
  excludedChars: string[],
}

enum ScanDirection {
  Up,
  Down,
}

type ScannerState = {
  scanDirection: ScanDirection,
  initialLineNumber: Readonly<number>,
  upperLineNumber: number,
  lowerLineNumber: number,
  upperLineBoundary: Readonly<number>,
  lowerLineBoundary: Readonly<number>,
}

class DocumentScanner implements IterableIterator<any> {
  // When generating a list of valid jump characters, there are cases where
  // the user continues typing, expecting to narrow down their search, but
  // accidentally trigger a jump instead. By excluding letters ahead of the
  // search match, we can prevent this from happening. This value was chosen
  // through trial and error, and prevents the above case from happening _most_
  // of the time.
  static EXCLUSION_LOOKAHEAD_LENGTH: number = 8
  static ITERATION_LIMIT: number = 200
  static NON_ALPHABETS: RegExp = /[^a-z]/gi

  readonly document: TextDocument
  scannerState: ScannerState
  iterationOrder: number[]
  documentIterator: Iterator<any>

  constructor(document: Readonly<TextDocument>, initialLineNumber: number, needle: string) {
    this.document = document
    this.scannerState = {
      scanDirection: ScanDirection.Down,
      initialLineNumber,
      upperLineNumber: initialLineNumber,
      lowerLineNumber: initialLineNumber,
      upperLineBoundary: 0,
      lowerLineBoundary: document.lineCount - 1,
    }

    // We want jump option updates to be as responsive as possible while the
    // user is typing, so we optimize this by generating the order of lines that
    // the scanner will go through while the extension is loading (it loads
    // every time the keyboard shortcut is activated). This greatly simplifies
    // the matching algorithm while the user is typing.
    this.iterationOrder = this.generateIterationOrder()
    this.documentIterator = this.createDocumentIterator(needle)
  }

  private generateIterationOrder = (): number[] => {
    // Pre-load iteration order with first line, a minor optimization
    const iterationOrder: number[] = [this.scannerState.initialLineNumber] 
    const documentLineCount = this.document.lineCount

    // The cursor might already be at a boundary (i.e. at the very top or bottom),
    // so we check for that first before entering the main generation loop,
    // and update the scanner's boundary state to reflect that.
    this.updateScannerBoundaryState()
    
    while (this.shouldContinueScanning(iterationOrder, documentLineCount)) {
      this.generateNextIteration(iterationOrder)
    }
    
    return iterationOrder
  }

  private updateScannerBoundaryState = () => {
    if (this.scannerState.upperLineNumber <= this.scannerState.upperLineBoundary) {
      this.scannerState.scanDirection = ScanDirection.Down
    }

    if (this.scannerState.lowerLineNumber >= this.scannerState.lowerLineBoundary) {
      this.scannerState.scanDirection = ScanDirection.Up
    }
  }

  private shouldContinueScanning = (iterationOrder: number[], documentLineCount: number): boolean => {
    const outOfLinesToScan = iterationOrder.length >= documentLineCount || documentLineCount === 1
    const atIterationLimit = iterationOrder.length >= DocumentScanner.ITERATION_LIMIT

    return !outOfLinesToScan && !atIterationLimit
  }

  private generateNextIteration = (iterationOrder: number[]): void => {
    const nextLineNumber = this.shiftCursorAndReverseScanDirection()
    iterationOrder.push(nextLineNumber)
    this.updateScannerBoundaryState()
  }

  private shiftCursorAndReverseScanDirection = (): number => {
    // We want jump options to appear as close to the user's cursor as possible,
    // since that is where the user is probably looking. To achieve this, we
    // generate the iteration order in a 'ripple' pattern originating from the
    // initial cursor position.
    // 
    // i.e. We scan the line at the initial cursor position, the one below the
    // initial, the one above the initial, then two above, two below, and so on.
    if (this.scannerState.scanDirection === ScanDirection.Down) {
      this.scannerState.lowerLineNumber += 1
      this.scannerState.scanDirection = ScanDirection.Up

      return this.scannerState.lowerLineNumber
    } else {
      this.scannerState.upperLineNumber -= 1
      this.scannerState.scanDirection = ScanDirection.Down

      return this.scannerState.upperLineNumber
    }
  }

  private* createDocumentIterator(needle: string): Iterator<any> {
    for (const currentLine of this.iterationOrder) {
      const haystack = this.getLineText(currentLine).toLowerCase()

      // It's common to have many matches for any given search term (needle) on
      // any line of text. String.prototype.indexOf() only returns the index of 
      // the *first* match, so we need to keep track of this and continue the
      // search until we reach the end of the line.
      for (let needleSearchResumePosition = 0;;) {
        needleSearchResumePosition = haystack.indexOf(needle, needleSearchResumePosition)
        const noMatchFound = needleSearchResumePosition === -1
        if (noMatchFound) break

        const matchStartIndex = needleSearchResumePosition
        const matchEndIndex = needleSearchResumePosition + needle.length
        needleSearchResumePosition = matchEndIndex
        const excludedChars = this.getExcludedChars(haystack, matchEndIndex)

        yield this.createMatch(currentLine, matchStartIndex, matchEndIndex, excludedChars)
      }
    }
  }

  private getLineText = (index: number): string => {
    return this.document.lineAt(index).text
  }

  private getExcludedChars = (haystack: string, matchEndIndex: number) => {
    const haystackExclusionEndIndex = matchEndIndex + DocumentScanner.EXCLUSION_LOOKAHEAD_LENGTH
    const unfilteredExcludedChars = haystack.slice(matchEndIndex, haystackExclusionEndIndex).split(DocumentScanner.NON_ALPHABETS)[0]

    return [...unfilteredExcludedChars]
  }

  private createMatch = (
    lineIndex: number,
    matchStartIndex: number,
    matchEndIndex: number,
    excludedChars: string[]
  ): Match => ({lineIndex, matchStartIndex, matchEndIndex, excludedChars})

  public next = (): IteratorResult<any> => {
    return this.documentIterator.next()
  }

  [Symbol.iterator](): IterableIterator<any> {
    return this
  }
}

export {Match, DocumentScanner}