import { calculateBlockRanges } from "./helper";

describe('calculateBlockRanges', () => {
  it('should calculate the block ranges correctly', () => {
    // Example input
    const blockNumbers = [1, 20, 500, 1230, 1240, 1242];
    const rangeSize = 50;

    // Expected output
    const expectedRanges = [
      { fromBlock: 1, toBlock: 20, count: 2 },
      { fromBlock: 500, toBlock: 500, count: 1 },
      { fromBlock: 1230, toBlock: 1242, count: 3 },
    ];

    // Calculate the ranges
    const result = calculateBlockRanges(blockNumbers, rangeSize);

    // Assert that the result matches the expected output
    expect(result).toEqual(expectedRanges);
  });

  it('should calculate the block ranges correctly when count larger than rangeSize', () => {
    // Example input
    const blockNumbers = [1, 20, 500, 1230, 1231, 1232, 1234, 1235, 1240, 1242];
    const rangeSize = 3;

    // Expected output
    const expectedRanges = [
      { fromBlock: 1, toBlock: 1, count: 1 },
      { fromBlock: 20, toBlock: 20, count: 1 },
      { fromBlock: 500, toBlock: 500, count: 1 },
      { fromBlock: 1230, toBlock: 1232, count: 3 },
      { fromBlock: 1234, toBlock: 1235, count: 2 },
      { fromBlock: 1240, toBlock: 1242, count: 2 },
    ];

    // Calculate the ranges
    const result = calculateBlockRanges(blockNumbers, rangeSize);

    // Assert that the result matches the expected output
    expect(result).toEqual(expectedRanges);
  });

  it('should handle an empty blockNumbers array', () => {
    // Empty input
    const blockNumbers = [];
    const rangeSize = 50;

    // Expected output
    const expectedRanges = [];

    // Calculate the ranges
    const result = calculateBlockRanges(blockNumbers, rangeSize);

    // Assert that the result matches the expected output
    expect(result).toEqual(expectedRanges);
  });

  // Add more test cases as needed
});
