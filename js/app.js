document.addEventListener("DOMContentLoaded", function(){

  // ========================
  // 1. REAL-TIME SLIDER VALUE UPDATES
  // ========================
  const parameterSliders = [
    'passive-solar-efficiency','gshp-cop','hpwh-efficiency','efficiency-adoption-rate',
    'solar-capacity','solar-cost','nuclear-capacity','nuclear-cost','electricity-price',
    'skysails-units','food-waste-utilization','agriculture-utilization','forest-utilization',
    'msw-utilization','algae-percentage','hemp-utilization','implementation-speed'
  ];

  parameterSliders.forEach(id => {
    const slider = document.getElementById(id);
    const displaySpan = document.getElementById(`${id}-value`);
    if (slider && displaySpan) {
      slider.addEventListener('input', () => {
        let val = slider.value;

        // Format displayed value
        if (id === 'electricity-price') {
          val = `${val}¢`;
        } else if (id === 'solar-capacity' || id === 'nuclear-capacity') {
          val = `${val} GW`;
        } else if (id === 'solar-cost' || id === 'nuclear-cost') {
          val = `$${val}/kW`;
        } else if (id === 'hpwh-efficiency') {
          val = `${parseFloat(val).toFixed(1)}x`;
        } else if (
          id.includes('efficiency') || id.includes('adoption') ||
          id.includes('utilization') || id.includes('percentage')
        ) {
          val = `${val}%`;
        } else if (id === 'skysails-units') {
          val = parseInt(val).toLocaleString();
        }
        // Implementation Speed doesn't need special formatting
        displaySpan.textContent = val;
      });
    }
  });

  // ========================
  // 2. SIDEBAR NAVIGATION
  // ========================
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", function(e){
      e.preventDefault();
      const target = this.getAttribute("data-target");
      document.querySelectorAll(".content-section").forEach(section => section.classList.remove("active"));
      document.getElementById(target).classList.add("active");
    });
  });

  // ========================
  // 3. TOGGLE BUTTONS
  // ========================
  document.getElementById('retrofit-button').addEventListener('click', function(){
    this.classList.add('active');
    document.getElementById('new-construction-button').classList.remove('active');
  });
  document.getElementById('new-construction-button').addEventListener('click', function(){
    this.classList.add('active');
    document.getElementById('retrofit-button').classList.remove('active');
  });

  // ========================
  // 4. CALCULATION FUNCTIONS
  // ========================
  function calculateSolarNuclearEnergy(solarGW, solarCost, nuclearGW, nuclearCost, electricityPrice) {
    const hoursPerYear = 8760;
    const solarCF = 0.25;
    const nuclearCF = 0.90;
    const solarEnergyTWh = (solarGW * hoursPerYear * solarCF) / 1000;
    const nuclearEnergyTWh = (nuclearGW * hoursPerYear * nuclearCF) / 1000;
    const totalEnergy = solarEnergyTWh + nuclearEnergyTWh;

    // Convert cost to billions
    const solarInvestment = (solarGW * 1e6 * solarCost) / 1e9;
    const nuclearInvestment = (nuclearGW * 1e6 * nuclearCost) / 1e9;
    const totalInvestment = solarInvestment + nuclearInvestment;

    // Carbon avoided placeholder
    const carbonAvoided = totalEnergy * 0.4; 
    const jobs = Math.round(totalInvestment * 1000); 

    const annualRevenue = (totalEnergy * 1e9 * (electricityPrice / 100)) / 1e9;
    const operatingCost = totalInvestment * 0.03;
    const netAnnualRevenue = annualRevenue - operatingCost;
    let payback = 0;
    if(netAnnualRevenue > 0) payback = totalInvestment / netAnnualRevenue;

    return {
      solarEnergyTWh,
      nuclearEnergyTWh,
      totalEnergy,
      solarInvestment,
      nuclearInvestment,
      totalInvestment,
      carbonAvoided,
      jobs,
      netAnnualRevenue,
      payback
    };
  }

  function calculateEfficiencySavings(passiveSolarEfficiency, gshpCOP, hpwhEfficiency, efficiencyAdoptionRate, isNewConstruction, electricityPrice) {
    const originalSpaceHeating = 4500, originalCooling = 643, originalWaterHeating = 1928, originalDryer = 536;
    
    // Passive solar
    const passiveSolarSavings = originalSpaceHeating * (passiveSolarEfficiency / 100);
    const remainingHeatingLoad = originalSpaceHeating - passiveSolarSavings;
    const gshpHeatingSavings = remainingHeatingLoad - (remainingHeatingLoad / gshpCOP);
    const gshpCoolingSavings = originalCooling - (originalCooling / gshpCOP);
    const hpwhSavings = originalWaterHeating - (originalWaterHeating / hpwhEfficiency);
    const drySavings = originalDryer * 0.28;

    const totalSavings = passiveSolarSavings + gshpHeatingSavings + gshpCoolingSavings + hpwhSavings + drySavings;
    const percentageReduction = (totalSavings / 10715) * 100;

    // Cost placeholders
    const passiveSolarCost = isNewConstruction ? 8000 : 18000;
    const geothermalInstallCost = 18000, hpwhCost = 1800, heatPumpDryerCost = 1200;
    const totalSystemCost = passiveSolarCost + geothermalInstallCost + hpwhCost + heatPumpDryerCost;
    const federalTaxCredit = (passiveSolarCost + geothermalInstallCost) * 0.30;
    const stateRebate = 3000, utilityRebate = 2000;
    const totalIncentives = federalTaxCredit + stateRebate + utilityRebate;
    const netSystemCost = totalSystemCost - totalIncentives;

    // Economic savings
    const annualCostSavings = totalSavings * (electricityPrice / 100);
    const netPayback = netSystemCost / annualCostSavings;

    // National scaling
    const households = 129900000;
    const homesAdopting = households * (efficiencyAdoptionRate / 100);
    const totalEnergySaved = (homesAdopting * totalSavings) / 1e9; // TWh
    const carbonReductionPerHousehold = (totalSavings * 0.417) / 1000; 
    const totalCarbonReduction = (homesAdopting * carbonReductionPerHousehold) / 1e6; 
    const percentOfUSEmissions = (totalCarbonReduction / 5222) * 100;

    // Freed capacity
    const evAnnualUsage = 2800;
    const evsPerHousehold = totalSavings / evAnnualUsage;
    const totalEvsSupported = homesAdopting * evsPerHousehold;
    const gridCapacityFreed = (totalEnergySaved / 3800) * 100;
    const totalNationalInvestment = (homesAdopting * netSystemCost) / 1e9; 
    const jobsCreated = Math.round(((homesAdopting * netSystemCost) / 1e6) * 5);

    return {
      perHousehold: {
        totalSavings,
        percentageReduction,
        systemCost: totalSystemCost,
        netSystemCost,
        annualCostSavings,
        paybackPeriod: netPayback
      },
      national: {
        totalEnergySaved,
        totalCarbonReduction,
        percentOfUSEmissions,
        totalInvestment: totalNationalInvestment,
        jobsCreated,
        annualSavings: (homesAdopting * annualCostSavings) / 1e9
      }
    };
  }

  function calculateWindEnergy(skySailsUnits, electricityPrice) {
    const hoursPerYear = 8760, capacityMW = 0.2, capacityFactor = 0.75;
    const productionPerUnitTWh = (capacityMW * hoursPerYear * capacityFactor) / 1e6;
    const energyTWh = skySailsUnits * productionPerUnitTWh;

    // $1M per unit => in billions
    const investmentB = skySailsUnits / 1000; 
    const carbonAvoided = energyTWh * 0.4;
    const jobs = skySailsUnits * 3; 

    const annualRevenue = (energyTWh * 1e9 * (electricityPrice / 100)) / 1e9;
    const operatingCost = investmentB * 0.03;
    const netAnnualRevenue = annualRevenue - operatingCost;
    let payback = 0;
    if(netAnnualRevenue > 0) payback = investmentB / netAnnualRevenue;

    return {
      energy: energyTWh,
      investment: investmentB,
      carbonAvoided,
      jobs,
      netAnnualRevenue,
      payback
    };
  }

  function calculateWasteProcessing(
    foodWasteUtil, agWasteUtil, forestUtil, mswUtil,
    algaeUtil, hempUtil, electricityPrice
  ) {
    const usableFoodWaste = 63 * (foodWasteUtil / 100);
    const usableAgWaste   = 800 * (agWasteUtil / 100);
    const usableForestWaste = 93 * (forestUtil / 100);
    const usableMSW       = 292 * (mswUtil / 100);

    // MWh/ton placeholders
    const foodWasteEnergy = (usableFoodWaste * 1.5) / 1e6;
    const agWasteEnergy   = (usableAgWaste * 1.2) / 1e6;
    const forestWasteEnergy = (usableForestWaste * 2.0) / 1e6;
    const mswEnergy       = (usableMSW * 0.6) / 1e6;
    const energyFromBiogas= 0.8; 
    const algaeBase = 28;
    const energyFromAlgae = (algaeUtil / 25) * algaeBase * 4;
    const hempBase = 3.3;
    const energyFromHemp = (hempUtil / 50) * hempBase * 2;

    const wasteToEnergyTotal = foodWasteEnergy + agWasteEnergy + forestWasteEnergy + mswEnergy + energyFromBiogas;
    const biofuelsTotal = energyFromAlgae + energyFromHemp;
    const totalEnergy = wasteToEnergyTotal + biofuelsTotal;

    // Calculate landfill space saved
    const totalWasteWeight = usableFoodWaste + usableAgWaste + usableForestWaste + usableMSW; // in tons
    const poundsPerTon = 2000;
    const poundsPerCubicYard = 1200;
    const landfillSpaceSaved = (totalWasteWeight * poundsPerTon) / poundsPerCubicYard;

    const carbonAvoided = totalEnergy * 0.417;
    const totalInvestment = 20; // $20B placeholder
    const electricityRevenueRate = electricityPrice / 100;
    const electricityRevenue = totalEnergy * 1000 * electricityRevenueRate;
    const carbonCreditValue = (carbonAvoided * 30) / 1000;
    const totalRevenue = electricityRevenue + carbonCreditValue;
    const operatingCost = totalInvestment * 0.05;
    const netAnnualValue = totalRevenue - operatingCost;
    const paybackPeriod = netAnnualValue>0 ? totalInvestment/netAnnualValue : 0;
    const jobsCreated = Math.round(totalInvestment * 1000 * 3);

    return {
      energyGeneration: { total: totalEnergy },
      carbonImpact: { total: carbonAvoided },
      landfillSpaceSaved: landfillSpaceSaved,
      economics: {
        totalInvestment,
        netAnnualRevenue: netAnnualValue,
        paybackPeriod,
        jobsCreated
      }
    };
  }

  function generatePhasedPlan(effResults, solarNuclearResults, windResults, wasteResults, effFirst){
    const effPhases = [0.05, 0.1, 0.2, 0.4, 0.7, 1.0];
    const genPhases = [0.0, 0.05, 0.2, 0.5, 0.8, 1.0];
    const speed = parseFloat(document.getElementById('implementation-speed').value);
    const speedFactor = speed / 10;
    const baseYearIncrement = 3 / speedFactor;

    const renewableEnergyTotal = solarNuclearResults.totalEnergy + windResults.energy + wasteResults.energyGeneration.total;
    const renewableCarbonTotal = solarNuclearResults.carbonAvoided + windResults.carbonAvoided + wasteResults.carbonImpact.total;
    const renewableInvestment  = solarNuclearResults.totalInvestment + windResults.investment + wasteResults.economics.totalInvestment;
    const renewableJobs        = solarNuclearResults.jobs + windResults.jobs + wasteResults.economics.jobsCreated;

    const phases = effFirst
      ? effPhases.map((effF, i) => {
          const year = 2025 + Math.floor(i * baseYearIncrement);
          const genF = genPhases[Math.max(0, i - 1)];
          return {
            year, phase: i+1,
            efficiencyFactor: effF,
            generationFactor: genF
          };
        })
      : genPhases.map((genF, i) => {
          const year = 2025 + Math.floor(i * baseYearIncrement);
          const effF = effPhases[Math.max(0, i - 2)];
          return {
            year, phase: i+1,
            efficiencyFactor: effF,
            generationFactor: genF
          };
        });

    return phases.map(p => {
      const effSaves = effResults.national.totalEnergySaved * p.efficiencyFactor;
      const effCO2   = effResults.national.totalCarbonReduction * p.efficiencyFactor;
      const effInv   = effResults.national.totalInvestment * p.efficiencyFactor;
      const effJobs  = effResults.national.jobsCreated * p.efficiencyFactor;

      const renEnergy= renewableEnergyTotal * p.generationFactor;
      const renCO2   = renewableCarbonTotal * p.generationFactor;
      const renInv   = renewableInvestment * p.generationFactor;
      const renJobs  = renewableJobs * p.generationFactor;

      const totalEnergyGen = renEnergy;
      const netEnergy = totalEnergyGen - effSaves;
      const totalCarbon = effCO2 + renCO2;
      const totalInvestment = effInv + renInv;
      const totalJobs = effJobs + renJobs;

      return {
        year: p.year,
        phase: p.phase,
        totals: {
          investment: totalInvestment,
          carbonReduction: totalCarbon,
          jobs: totalJobs,
          netEnergyImpact: netEnergy,
          percentOfUSEmissions: (totalCarbon / 5222)*100
        }
      };
    });
  }

  function updatePhasedPlanTable(plan) {
    const tbody = document.getElementById("phased-plan-table").querySelector("tbody");
    tbody.innerHTML = "";
    plan.forEach(ph => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${ph.phase}</td>
        <td>${ph.year}</td>
        <td>${formatNumber(ph.totals.carbonReduction)}</td>
        <td>${formatNumber(ph.totals.investment)}</td>
        <td>${formatNumber(ph.totals.netEnergyImpact)}</td>
        <td>${formatNumber(ph.totals.jobs/1e6,1)}M</td>
      `;
      tbody.appendChild(row);
    });
  }

  // CHART for the Dashboard
  let energyMixChart;
  function updateEnergyMixChart(solarNuclear, windResults, wasteResults){
    const labels = ["Solar/Nuclear", "Wind (SkySails)", "Waste"];
    const data = [
      solarNuclear.totalEnergy,
      windResults.energy,
      wasteResults.energyGeneration.total
    ];
    const ctx = document.getElementById("energyMixChart").getContext("2d");

    if(energyMixChart){
      energyMixChart.data.datasets[0].data = data;
      energyMixChart.update();
    } else {
      energyMixChart = new Chart(ctx, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: ["#2563eb","#16a34a","#d97706"]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom"
            }
          }
        }
      });
    }
  }

  // Helper: format numbers
  function formatNumber(num, decimals=2){
    if(num === undefined || num === null) return "N/A";
    if(num === 0) return "0";
    if(Math.abs(num) < 1000) return parseFloat(num.toFixed(decimals));
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  // MAIN updateCalculations
  function updateCalculations(){
    // Grab all input values
    const passiveSolarEff = parseFloat(document.getElementById("passive-solar-efficiency").value);
    const gshpCOP         = parseFloat(document.getElementById("gshp-cop").value);
    const hpwhEff         = parseFloat(document.getElementById("hpwh-efficiency").value);
    const effAdoptionRate = parseFloat(document.getElementById("efficiency-adoption-rate").value);
    const isNewConstruction = document.getElementById("new-construction-button").classList.contains("active");
    const elecPrice       = parseFloat(document.getElementById("electricity-price").value);

    const solarGW         = parseFloat(document.getElementById("solar-capacity").value);
    const solarCost       = parseFloat(document.getElementById("solar-cost").value);
    const nuclearGW       = parseFloat(document.getElementById("nuclear-capacity").value);
    const nuclearCost     = parseFloat(document.getElementById("nuclear-cost").value);

    const skySailsUnits   = parseFloat(document.getElementById("skysails-units").value);

    const foodWasteUtil   = parseFloat(document.getElementById("food-waste-utilization").value);
    const agWasteUtil     = parseFloat(document.getElementById("agriculture-utilization").value);
    const forestUtil      = parseFloat(document.getElementById("forest-utilization").value);
    const mswUtil         = parseFloat(document.getElementById("msw-utilization").value);
    const algaeUtil       = parseFloat(document.getElementById("algae-percentage").value);
    const hempUtil        = parseFloat(document.getElementById("hemp-utilization").value);

    // This was missing from the HTML before; we just re-added it:
    const effFirst = false; // or set from a toggle if you have one
    // If you had a slider/toggle for efficiency-first:
    // const effFirst = (document.getElementById("efficiency-first-toggle").value === "1");

    // Perform calculations
    const effResults = calculateEfficiencySavings(
      passiveSolarEff, gshpCOP, hpwhEff,
      effAdoptionRate, isNewConstruction, elecPrice
    );
    const solarNuclear = calculateSolarNuclearEnergy(
      solarGW, solarCost, nuclearGW, nuclearCost, elecPrice
    );
    const windResults = calculateWindEnergy(
      skySailsUnits, elecPrice
    );
    const wasteResults = calculateWasteProcessing(
      foodWasteUtil, agWasteUtil, forestUtil,
      mswUtil, algaeUtil, hempUtil, elecPrice
    );

    const totalCleanEnergy = solarNuclear.totalEnergy + windResults.energy + wasteResults.energyGeneration.total;
    const totalCarbonReduction = effResults.national.totalCarbonReduction +
                                 solarNuclear.carbonAvoided +
                                 windResults.carbonAvoided +
                                 wasteResults.carbonImpact.total;

    const netEnergyImpact = totalCleanEnergy - effResults.national.totalEnergySaved;
    const totalInvestment = effResults.national.totalInvestment +
                            solarNuclear.totalInvestment +
                            windResults.investment +
                            wasteResults.economics.totalInvestment;
    const totalJobs = effResults.national.jobsCreated +
                      solarNuclear.jobs +
                      windResults.jobs +
                      wasteResults.economics.jobsCreated;

    const annualBenefits = effResults.national.annualSavings +
                           solarNuclear.netAnnualRevenue +
                           windResults.netAnnualRevenue +
                           wasteResults.economics.netAnnualRevenue;
    const payback = (totalInvestment>0 && annualBenefits>0) ? (totalInvestment/annualBenefits) : 0;
    const percentEmissionsReduced = (totalCarbonReduction/5222)*100;

    // Update Dashboard
    document.getElementById("net-energy-impact").textContent =
      `${formatNumber(netEnergyImpact,2)} TWh`;
    document.getElementById("net-energy-percent").textContent =
      `${formatNumber((netEnergyImpact/3800)*100,2)}% of US consumption`;
    document.getElementById("carbon-reduction").textContent =
      `${formatNumber(totalCarbonReduction,2)} MT`;
    document.getElementById("carbon-percent").textContent =
      `${formatNumber(percentEmissionsReduced,2)}% of US emissions`;
      
    // Update landfill space saved if the elements exist
    if (document.getElementById("landfill-space-saved")) {
      document.getElementById("landfill-space-saved").textContent =
        `${formatNumber(wasteResults.landfillSpaceSaved, 0)} cubic yards`;
    }
    if (document.getElementById("landfill-percent")) {
      const percentLandfillSaved = (wasteResults.landfillSpaceSaved / 146000000) * 100; // US landfill ~146M cubic yards/year
      document.getElementById("landfill-percent").textContent =
        `${formatNumber(percentLandfillSaved, 2)}% reduction`;
    }
    
    document.getElementById("total-investment").textContent =
      `$${formatNumber(totalInvestment,2)} B`;
    document.getElementById("payback-period").textContent =
      `Payback: ${formatNumber(payback,1)} years`;
    document.getElementById("jobs-created").textContent =
      `${formatNumber(totalJobs/1e6,1)}M`;

    if(totalInvestment>0){
      document.getElementById("jobs-per-million").textContent =
        `${formatNumber(totalJobs/(totalInvestment*1000),1)} jobs per $1M`;
    } else {
      document.getElementById("jobs-per-million").textContent = "-";
    }

    // Update Chart
    updateEnergyMixChart(solarNuclear, windResults, wasteResults);

    // Generate phased plan
    const phased = generatePhasedPlan(effResults, solarNuclear, windResults, wasteResults, effFirst);
    updatePhasedPlanTable(phased);
  }

  // ========================
  // 5. EVENT LISTENERS
  // ========================
  document.getElementById("apply-parameters-button").addEventListener("click", updateCalculations);

  const resetButton = document.getElementById("reset-button");
  if(resetButton){
    resetButton.addEventListener("click", () => window.location.reload());
  }

  const exportButton = document.getElementById("export-button");
  if(exportButton){
    exportButton.addEventListener("click", function(){
      const dataToExport = {
        netEnergyImpact: document.getElementById("net-energy-impact").textContent,
        carbonReduction: document.getElementById("carbon-reduction").textContent,
        totalInvestment: document.getElementById("total-investment").textContent,
        jobsCreated:     document.getElementById("jobs-created").textContent,
      };
      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "results.json";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  // Run initial calculations on load
  updateCalculations();
});
