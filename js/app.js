document.addEventListener("DOMContentLoaded", function() {
  // Helper function to format numbers with commas
  function formatNumber(num, decimals = 0) {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  
  // Update dashboard with calculation results
  function updateDashboard(
    efficiencyResults, solarResults, nuclearResults, hydroResults,
    windResults, wasteResults, carbonCaptureResults
  ) {
    // Calculate total values
    const totalEnergyEfficiency = efficiencyResults.national.totalEnergySaved;
    const percentEfficiency = efficiencyResults.perHousehold.percentageReduction;
    
    // Net energy impact
    const totalEnergyGeneration = 
      solarResults.energyTWh + 
      nuclearResults.energyTWh + 
      hydroResults.energyTWh + 
      windResults.totalEnergyTWh + 
      wasteResults.energyGeneration.total + 
      carbonCaptureResults.energyFromFuels;
    
    const netEnergyImpact = totalEnergyGeneration - totalEnergyEfficiency;
    const percentOfUSConsumption = (netEnergyImpact / 4000) * 100; // US consumption ~4000 TWh
    
    // Carbon reduction
    const totalCarbonReduction = 
      efficiencyResults.national.totalCarbonReduction + 
      solarResults.carbonAvoided + 
      nuclearResults.carbonAvoided + 
      hydroResults.carbonAvoided + 
      windResults.carbonAvoided + 
      wasteResults.carbonImpact.total + 
      carbonCaptureResults.carbonAvoided;
    
    const percentOfUSEmissions = (totalCarbonReduction / 5222) * 100; // US emissions ~5222 MT
    
    // Landfill space saved
    const landfillSpaceSaved = wasteResults.landfillSpaceSaved;
    const percentLandfillSaved = (landfillSpaceSaved / 146000000) * 100; // US landfill ~146M cubic yards/year
    
    // Investment
    const totalInvestment = 
      efficiencyResults.national.totalInvestment + 
      solarResults.investment + 
      nuclearResults.investment + 
      hydroResults.investment + 
      windResults.totalInvestment + 
      wasteResults.economics.totalInvestment + 
      carbonCaptureResults.investment;
    
    // Calculate weighted average payback
    const weightedPayback = (
      (efficiencyResults.national.totalInvestment * efficiencyResults.perHousehold.paybackPeriod) +
      (solarResults.investment * solarResults.payback) +
      (nuclearResults.investment * nuclearResults.payback) +
      (hydroResults.investment * hydroResults.payback) +
      (windResults.totalInvestment * windResults.payback) +
      (wasteResults.economics.totalInvestment * wasteResults.economics.paybackPeriod) +
      (carbonCaptureResults.investment * carbonCaptureResults.economics.paybackPeriod)
    ) / totalInvestment;
    
    const payback = isNaN(weightedPayback) ? 0 : weightedPayback;
    
    // Jobs
    const totalJobs = 
      efficiencyResults.national.jobsCreated + 
      solarResults.jobs + 
      nuclearResults.jobs + 
      hydroResults.jobs + 
      windResults.totalJobs + 
      wasteResults.economics.jobsCreated + 
      carbonCaptureResults.jobs;
    
    const jobsPerMillion = totalJobs / (totalInvestment * 1000);
    
    // Update dashboard elements
    // Energy Efficiency
    document.getElementById("energy-efficiency-impact").textContent = 
      `${formatNumber(totalEnergyEfficiency, 1)} TWh`;
    document.getElementById("efficiency-percent").textContent = 
      `${formatNumber(percentEfficiency, 1)}% reduction`;
    
    // Net Energy Impact
    document.getElementById("net-energy-impact").textContent = 
      `${formatNumber(netEnergyImpact, 1)} TWh`;
    document.getElementById("net-energy-percent").textContent = 
      `${formatNumber(percentOfUSConsumption, 1)}% of US consumption`;
    
    // Carbon Reduction
    document.getElementById("carbon-reduction").textContent = 
      `${formatNumber(totalCarbonReduction, 1)} MT`;
    document.getElementById("carbon-percent").textContent = 
      `${formatNumber(percentOfUSEmissions, 1)}% of US emissions`;
    
    // Landfill space
    document.getElementById("landfill-space-saved").textContent =
      `${formatNumber(landfillSpaceSaved, 0)} cubic yards`;
    document.getElementById("landfill-percent").textContent =
      `${formatNumber(percentLandfillSaved, 2)}% reduction`;

    // Investment
    document.getElementById("total-investment").textContent =
      `$${formatNumber(totalInvestment, 2)} B`;
    document.getElementById("payback-period").textContent =
      `Payback: ${formatNumber(payback, 1)} years`;

    // Jobs
    document.getElementById("jobs-created").textContent =
      `${formatNumber(totalJobs / 1e6, 1)}M`;
    document.getElementById("jobs-per-million").textContent =
      `${formatNumber(jobsPerMillion, 1)} jobs per $1M`;
  }
});
