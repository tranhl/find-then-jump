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
  initialCursorPosition: Readonly<number>,
  upperCursorPosition: number,
  lowerCursorPosition: number,
  upperBoundary: Readonly<number>,
  lowerBoundary: Readonly<number>,
  upperBoundaryReached: boolean,
  lowerBoundaryReached: boolean,
}

class DocumentScanner implements IterableIterator<any> {
  // When generating a list of valid jump characters, there are cases where
  // the user continues typing, expecting to narrow down their search, but
  // accidentally trigger a jump instead. By excluding letters ahead of the
  // search match, we can prevent this from happening. This value was chosen
  // through trial and error, and prevents the above case from happening.
  static EXCLUSION_LOOKAHEAD_LENGTH: number = 8
  static ITERATION_LIMIT: number = 200 // Prevents degraded performance for large files
  static NON_ALPHABETS: RegExp = /[^a-z]/gi

  readonly document: TextDocument
  scannerState: ScannerState
  iterationOrder: number[]
  documentIterator: Iterator<any>

  constructor(document: Readonly<TextDocument>, initialCursorPosition: number, needle: string) {
    this.document = document
    this.scannerState = {
      scanDirection: ScanDirection.Down,
      initialCursorPosition,
      upperCursorPosition: initialCursorPosition,
      lowerCursorPosition: initialCursorPosition,
      upperBoundary: 0,
      lowerBoundary: document.lineCount - 1,
      upperBoundaryReached: false,
      lowerBoundaryReached: false,
    }
    this.iterationOrder = this.generateIterationOrder()
    this.documentIterator = this.createDocumentIterator(needle)
  }

  private generateIterationOrder = (): number[] => {
    const iterationOrder: number[] = [this.scannerState.initialCursorPosition]
    const documentLineCount = this.document.lineCount

    if (documentLineCount === 1) {
      return iterationOrder
    }

    this.checkScannerBoundaries()

    do {
      const nextCursorPosition = this.shiftCursorAndReverseScanDirection()
      iterationOrder.push(nextCursorPosition)
      this.checkScannerBoundaries()
    } while (
      iterationOrder.length < documentLineCount
      && iterationOrder.length < DocumentScanner.ITERATION_LIMIT
    )
    
    return iterationOrder
  }

  private checkScannerBoundaries = () => {
    if (this.scannerState.upperCursorPosition <= this.scannerState.upperBoundary) {
      this.scannerState.upperBoundaryReached = true
      this.scannerState.scanDirection = ScanDirection.Down
    }

    if (this.scannerState.lowerCursorPosition >= this.scannerState.lowerBoundary) {
      this.scannerState.lowerBoundaryReached = true
      this.scannerState.scanDirection = ScanDirection.Up
    }
  }

  private shiftCursorAndReverseScanDirection = (): number => {
    if (this.scannerState.scanDirection === ScanDirection.Down) {
      this.scannerState.lowerCursorPosition += 1
      this.scannerState.scanDirection = ScanDirection.Up

      return this.scannerState.lowerCursorPosition
    } else {
      this.scannerState.upperCursorPosition -= 1
      this.scannerState.scanDirection = ScanDirection.Down

      return this.scannerState.upperCursorPosition
    }
  }

  private* createDocumentIterator(needle: string): Iterator<any> {
    for (const currentLine of this.iterationOrder) {
      const haystack = this.getLineText(currentLine).toLowerCase()

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
    const unfilteredExcludedChars = haystack.slice(matchEndIndex, haystackExclusionEndIndex)
    const filteredExcludedChars = unfilteredExcludedChars.replace(DocumentScanner.NON_ALPHABETS, '')

    return [...filteredExcludedChars]
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