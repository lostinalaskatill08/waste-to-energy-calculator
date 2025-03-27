describe('Calculator Functions', () => {
  // Mock document methods needed by the calculator
  document.getElementById = jest.fn();
  document.querySelector = jest.fn();
  document.querySelectorAll = jest.fn();
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('calculateSolarEnergy returns expected values', () => {
    const result = calculateSolarEnergy(10, 1000, 0, 12);
    expect(result.energyTWh).toBeCloseTo(21.9, 1);
    expect(result.investment).toBeCloseTo(10, 1);
  });

  test('calculateWindEnergy returns expected values', () => {
    const result = calculateWindEnergy(100, 5, 0, 12);
    expect(result.totalEnergyTWh).toBeGreaterThan(0);
    expect(result.totalInvestment).toBeGreaterThan(0);
  });

  test('calculateWasteProcessing returns expected values', () => {
    const result = calculateWasteProcessing(50, 50, 50, 50, 50, 50, 0, 12);
    expect(result.wasteProcessedMT).toBeGreaterThan(0);
    expect(result.landfillSpaceSaved).toBeGreaterThan(0);
  });
});