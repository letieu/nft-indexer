export function calculateBlockRanges(blockNumbers: number[], rangeSize: number): { fromBlock: number; toBlock: number; count: number; }[] {
  const ranges = [];
  if (blockNumbers.length === 0) return ranges;

  const blocks = [...blockNumbers.sort((a, b) => a - b)];

  while (blocks.length) {
    const fromBlock = blocks.shift();
    let toBlock = fromBlock;
    let count = 1;

    while (blocks.length && blocks[0] - fromBlock < rangeSize) {
      toBlock = blocks.shift();
      count++;
    }

    ranges.push({ fromBlock, toBlock, count });
  }

  return ranges;
}
