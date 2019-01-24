import {TextDocument} from 'vscode'

type Match = {
  lineIndex: number,
  matchStartIndex: number,
  matchEndIndex: number,
  excludedChars: string[],
}

class DocumentScanner implements IterableIterator<any> {
  // When generating a list of valid jump characters, there are cases where
  // the user continues typing, expecting to narrow down their search, but
  // accidentally trigger a jump instead. By excluding letters ahead of the
  // search match, we can prevent this from happening. This value was chosen
  // through trial and error, and prevents the above case from happening.
  static EXCLUSION_LOOKAHEAD_LENGTH: number = 8
  static MAX_LINES_TO_SCAN: number = 300
  static NON_ALPHABETS: RegExp = /[^a-z]/gi

  readonly document: TextDocument
  scanOrder: number[]
  documentIterator: Iterator<any>

  constructor(document: Readonly<TextDocument>, startLine: number, needle: string) {
    this.document = document
    this.scanOrder = this.generateScanOrder(document, startLine)
    this.documentIterator = this.createDocumentIterator(needle)
  }

  private generateScanOrder = (document: Readonly<TextDocument>, startLine: number): number[] => {
    const scanOrder: number[] = []
    const documentLineCount = document.lineCount

    if (documentLineCount === 1) {
      scanOrder.push(startLine)
      return scanOrder
    }
      
    if (documentLineCount === 2) {
      scanOrder.push(
        startLine,
        (startLine + 1) % 2
      )

      return scanOrder
    }

    if (documentLineCount === 3) {
      // This ordering ensures that the line below the start line, including
      // wrap-around, is always scanned immediately after the start line.
      scanOrder.push(
        startLine,
        (startLine - 2) % 3,
        (startLine + 2) % 3
      )

      return scanOrder
    }

    const upperBoundary = 0
    const lowerBoundary = documentLineCount - 1
    const shiftAwayFromBoundary = this.isStartLineInTopHalf(startLine, documentLineCount) ? 1 : -1
    let currentLine = startLine
    let hasHitBoundary = false
    
    if (startLine === upperBoundary || startLine === lowerBoundary) {
      scanOrder.push(
        currentLine,
        currentLine + (2 * shiftAwayFromBoundary),
        currentLine + (3 * shiftAwayFromBoundary)
      )

      currentLine += (3 * shiftAwayFromBoundary)
      hasHitBoundary = true
    } else {
      scanOrder.push(
        currentLine,
        currentLine + 1,
        currentLine - 1
      )
    }

    if (startLine + 2 > lowerBoundary) {
      currentLine -= 2
      hasHitBoundary = true
    } else {
      currentLine += 2
    }

    while (
      scanOrder.length < documentLineCount
      && scanOrder.length <= DocumentScanner.MAX_LINES_TO_SCAN
    ) {
      scanOrder.push(currentLine)

      if (hasHitBoundary) {
        currentLine += shiftAwayFromBoundary
        continue
      }

      const pivotedLine = this.pivotLine(startLine, currentLine)

      if (pivotedLine < upperBoundary || pivotedLine > lowerBoundary) {
        currentLine += shiftAwayFromBoundary
        hasHitBoundary = true

        continue
      }

      if (currentLine === upperBoundary || currentLine === lowerBoundary) {
        hasHitBoundary = true
      }

      currentLine = pivotedLine
    }

    return scanOrder
  }

  private isStartLineInTopHalf = (startLine: number, documentLineCount: number): boolean => {
    return startLine <= Math.floor(documentLineCount) / 2
  }

  private pivotLine = (startLine: number, currentLine: number): number => {
    const distanceBetweenStartAndCurrentLine = Math.abs(currentLine - startLine)
    const pivotDistance = 2 * distanceBetweenStartAndCurrentLine
    const isCurrentLineInTopHalf = currentLine < startLine

    if (isCurrentLineInTopHalf) {
      return currentLine + pivotDistance + 1
    } else {
      return currentLine - pivotDistance
    }
  }

  private* createDocumentIterator(needle: string): Iterator<any> {
    for (const currentLine of this.scanOrder) {
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