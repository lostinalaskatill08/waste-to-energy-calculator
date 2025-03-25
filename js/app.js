document.addEventListener("DOMContentLoaded", function(){

  // ========================
  // 1. REAL-TIME SLIDER VALUE UPDATES
  // ========================
  const parameterSliders = [
    // Energy Efficiency
    'passive-solar-efficiency','gshp-cop','hpwh-efficiency','efficiency-adoption-rate',
    
    // Energy Generation
    'solar-capacity','solar-cost','solar-jobs-factor',
    'skysails-units','traditional-wind-capacity','wind-jobs-factor',
    'hydro-capacity','hydro-cost','hydro-jobs-factor',
    'nuclear-capacity','nuclear-cost','nuclear-jobs-factor',
    'electricity-price',
    
    // Biomass & Waste
    'food-waste-utilization','agriculture-utilization','forest-utilization',
    'msw-utilization','algae-percentage','hemp-utilization','biomass-jobs-factor',
    
    // Carbon Capture
    'carbon-capture-capacity','carbon-storage-percentage','carbon-fuel-percentage',
    'carbon-capture-cost','carbon-capture-jobs-factor',
    
    // Implementation
    'implementation-years','implementation-speed'
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
        } else if (id.includes('capacity') && !id.includes('carbon')) {
          val = `${val} GW`;
        } else if (id === 'carbon-capture-capacity') {
          val = `${val} MT/year`;
        } else if (id.includes('cost')) {
          if (id === 'carbon-capture-cost') {
            val = `$${val}/ton`;
          } else {
            val = `$${val}/kW`;
          }
        } else if (id === 'hpwh-efficiency') {
          val = `${parseFloat(val).toFixed(1)}x`;
        } else if (
          id.includes('efficiency') || id.includes('adoption') ||
          id.includes('utilization') || id.includes('percentage')
        ) {
          val = `${val}%`;
        } else if (id === 'skysails-units') {
          val = parseInt(val).toLocaleString();
        } else if (id === 'implementation-years') {
          val = `${val} years`;
        } else if (id.includes('jobs-factor') && !id.includes('biomass') && !id.includes('carbon')) {
          val = `${parseFloat(val).toFixed(1)}`;
        }
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
  
  document.getElementById('efficiency-first-button').addEventListener('click', function(){
    this.classList.add('active');
    document.getElementById('generation-first-button').classList.remove('active');
  });
  document.getElementById('generation-first-button').addEventListener('click', function(){
    this.classList.add('active');
    document.getElementById('efficiency-first-button').classList.remove('active');
  });

  // ========================
  // 4. CALCULATION FUNCTIONS
  // ========================
  
  // Calculate Solar Energy
  function calculateSolarEnergy(solarGW, solarCost, solarJobsFactor, electricityPrice) {
    const hoursPerYear = 8760;
    const solarCF = 0.25;
    
    // Energy calculation
    const solarEnergyTWh = (solarGW * hoursPerYear * solarCF) / 1000;
    
    // Investment calculation (in billions)
    const solarInvestment = (solarGW * 1e6 * solarCost) / 1e9;
    
    // Jobs calculation based on jobs per MW factor
    const jobs = Math.round(solarGW * 1000 * solarJobsFactor);
    
    // Carbon avoided (tons)
    const carbonAvoided = solarEnergyTWh * 0.417; // 0.417 MT CO2 per TWh
    
    // Economic calculations
    const annualRevenue = (solarEnergyTWh * 1e9 * (electricityPrice / 100)) / 1e9;
    const operatingCost = solarInvestment * 0.02; // 2% O&M costs
    const netAnnualRevenue = annualRevenue - operatingCost;
    let payback = 0;
    if(netAnnualRevenue > 0) payback = solarInvestment / netAnnualRevenue;
    
    return {
      energyTWh: solarEnergyTWh,
      investment: solarInvestment,
      jobs: jobs,
      carbonAvoided: carbonAvoided,
      netAnnualRevenue: netAnnualRevenue,
      payback: payback
    };
  }
  
  // Calculate Nuclear Energy
  function calculateNuclearEnergy(nuclearGW, nuclearCost, nuclearJobsFactor, electricityPrice) {
    const hoursPerYear = 8760;
    const nuclearCF = 0.90;
    
    // Energy calculation
    const nuclearEnergyTWh = (nuclearGW * hoursPerYear * nuclearCF) / 1000;
    
    // Investment calculation (in billions)
    const nuclearInvestment = (nuclearGW * 1e6 * nuclearCost) / 1e9;
    
    // Jobs calculation based on jobs per MW factor
    const jobs = Math.round(nuclearGW * 1000 * nuclearJobsFactor);
    
    // Carbon avoided (tons)
    const carbonAvoided = nuclearEnergyTWh * 0.417; // 0.417 MT CO2 per TWh
    
    // Economic calculations
    const annualRevenue = (nuclearEnergyTWh * 1e9 * (electricityPrice / 100)) / 1e9;
    const operatingCost = nuclearInvestment * 0.04; // 4% O&M costs
    const netAnnualRevenue = annualRevenue - operatingCost;
    let payback = 0;
    if(netAnnualRevenue > 0) payback = nuclearInvestment / netAnnualRevenue;
    
    return {
      energyTWh: nuclearEnergyTWh,
      investment: nuclearInvestment,
      jobs: jobs,
      carbonAvoided: carbonAvoided,
      netAnnualRevenue: netAnnualRevenue,
      payback: payback
    };
  }
  
  // Calculate Hydro Energy
  function calculateHydroEnergy(hydroGW, hydroCost, hydroJobsFactor, electricityPrice) {
    const hoursPerYear = 8760;
    const hydroCF = 0.40; // Capacity factor for hydro
    
    // Energy calculation
    const hydroEnergyTWh = (hydroGW * hoursPerYear * hydroCF) / 1000;
    
    // Investment calculation (in billions)
    const hydroInvestment = (hydroGW * 1e6 * hydroCost) / 1e9;
    
    // Jobs calculation based on jobs per MW factor
    const jobs = Math.round(hydroGW * 1000 * hydroJobsFactor);
    
    // Carbon avoided (tons)
    const carbonAvoided = hydroEnergyTWh * 0.417; // 0.417 MT CO2 per TWh
    
    // Economic calculations
    const annualRevenue = (hydroEnergyTWh * 1e9 * (electricityPrice / 100)) / 1e9;
    const operatingCost = hydroInvestment * 0.025; // 2.5% O&M costs
    const netAnnualRevenue = annualRevenue - operatingCost;
    let payback = 0;
    if(netAnnualRevenue > 0) payback = hydroInvestment / netAnnualRevenue;
    
    return {
      energyTWh: hydroEnergyTWh,
      investment: hydroInvestment,
      jobs: jobs,
      carbonAvoided: carbonAvoided,
      netAnnualRevenue: netAnnualRevenue,
      payback: payback
    };
  }

  function calculateEfficiencySavings(
    passiveSolarEfficiency, gshpCOP, hpwhEfficiency, efficiencyAdoptionRate,
    isNewConstruction, electricityPrice
  ) {
    const originalSpaceHeating = 4500, originalCooling = 643,
          originalWaterHeating = 1928, originalDryer = 536;
    
    // Passive solar
    const passiveSolarSavings = originalSpaceHeating * (passiveSolarEfficiency / 100);
    const remainingHeatingLoad = originalSpaceHeating - passiveSolarSavings;
    const gshpHeatingSavings = remainingHeatingLoad - (remainingHeatingLoad / gshpCOP);
    const gshpCoolingSavings = originalCooling - (originalCooling / gshpCOP);
    const hpwhSavings = originalWaterHeating - (originalWaterHeating / hpwhEfficiency);
    const drySavings = originalDryer * 0.28; // ~28% savings for HP dryer

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
    const totalNationalInvestment = (homesAdopting * netSystemCost) / 1e9; 
    const jobsCreated = Math.round(((homesAdopting * netSystemCost) / 1e6) * 5);

    return {
      perHousehold: {
        passiveSolarSavings,
        gshpHeatingSavings,
        gshpCoolingSavings,
        hpwhSavings,
        drySavings,
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

  function calculateWindEnergy(skySailsUnits, traditionalWindGW, windJobsFactor, electricityPrice) {
    const hoursPerYear = 8760, capacityMW = 0.2, capacityFactor = 0.75;
    const productionPerUnitTWh = (capacityMW * hoursPerYear * capacityFactor) / 1e6;
    const energyTWh = skySailsUnits * productionPerUnitTWh;
    
    // Traditional wind energy calculation
    const traditionalWindCF = 0.35; // Capacity factor for traditional wind
    const traditionalWindEnergyTWh = (traditionalWindGW * hoursPerYear * traditionalWindCF) / 1000;
    
    // Total wind energy
    const totalWindEnergyTWh = energyTWh + traditionalWindEnergyTWh;
    
    // Investment calculation
    const skySailsInvestment = skySailsUnits / 1000; // $1M per unit => in billions
    const traditionalWindInvestment = (traditionalWindGW * 1e6 * 1500) / 1e9; // Assuming $1500/kW
    const totalInvestment = skySailsInvestment + traditionalWindInvestment;
    
    // Jobs calculation
    const skySailsJobs = skySailsUnits * 3; // 3 jobs per unit
    const traditionalWindJobs = Math.round(traditionalWindGW * 1000 * windJobsFactor);
    const totalJobs = skySailsJobs + traditionalWindJobs;
    
    // Carbon avoided
    const carbonAvoided = totalWindEnergyTWh * 0.417;
    
    // Economic calculations
    const annualRevenue = (totalWindEnergyTWh * 1e9 * (electricityPrice / 100)) / 1e9;
    const operatingCost = totalInvestment * 0.03;
    const netAnnualRevenue = annualRevenue - operatingCost;
    let payback = 0;
    if(netAnnualRevenue > 0) payback = totalInvestment / netAnnualRevenue;
    
    return {
      skySailsEnergyTWh: energyTWh,
      traditionalWindEnergyTWh: traditionalWindEnergyTWh,
      totalEnergyTWh: totalWindEnergyTWh,
      skySailsInvestment: skySailsInvestment,
      traditionalWindInvestment: traditionalWindInvestment,
      totalInvestment: totalInvestment,
      skySailsJobs: skySailsJobs,
      traditionalWindJobs: traditionalWindJobs,
      totalJobs: totalJobs,
      carbonAvoided: carbonAvoided,
      netAnnualRevenue: netAnnualRevenue,
      payback: payback
    };
  }

  function calculateWasteProcessing(
    foodWasteUtil, agWasteUtil, forestUtil, mswUtil,
    algaeUtil, hempUtil, biomassJobsFactor, electricityPrice
  ) {
    const usableFoodWaste = 63 * (foodWasteUtil / 100);
    const usableAgWaste   = 800 * (agWasteUtil / 100);
    const usableForestWaste = 93 * (forestUtil / 100);
    const usableMSW       = 292 * (mswUtil / 100);
    
    // Total waste processed in million tons
    const totalWasteProcessed = (usableFoodWaste + usableAgWaste + usableForestWaste + usableMSW) / 1e6;
    
    // MWh/ton energy conversion
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

    // Landfill space saved calculation
    // Assuming average waste density of 1200 pounds per cubic yard
    const totalWasteWeight = usableFoodWaste + usableAgWaste + usableForestWaste + usableMSW; // in tons
    const poundsPerTon = 2000;
    const poundsPerCubicYard = 1200;
    const landfillSpaceSaved = (totalWasteWeight * poundsPerTon) / poundsPerCubicYard;
    
    // Carbon calculations
    const directCarbonAvoided = totalEnergy * 0.417; // From energy generation
    const landfillMethaneAvoided = usableFoodWaste * 0.5 + usableMSW * 0.3; // Methane avoidance
    const totalCarbonAvoided = directCarbonAvoided + landfillMethaneAvoided;
    
    // Investment and economic calculations
    const wasteProcessingInvestment = 15; // $15B base investment
    const biofuelsInvestment = 5 * (algaeUtil / 50 + hempUtil / 50); // Additional investment for biofuels
    const totalInvestment = wasteProcessingInvestment + biofuelsInvestment;
    
    const electricityRevenueRate = electricityPrice / 100;
    const electricityRevenue = totalEnergy * 1000 * electricityRevenueRate;
    const materialRecoveryRevenue = totalWasteProcessed * 50; // $50M per million tons in recovered materials
    const carbonCreditValue = (totalCarbonAvoided * 30) / 1000;
    const totalRevenue = electricityRevenue + materialRecoveryRevenue + carbonCreditValue;
    
    const operatingCost = totalInvestment * 0.05;
    const netAnnualValue = totalRevenue - operatingCost;
    const paybackPeriod = netAnnualValue > 0 ? totalInvestment / netAnnualValue : 0;
    
    // Jobs calculation based on biomass jobs factor
    const jobsCreated = Math.round(totalWasteProcessed * biomassJobsFactor);

    return {
      energyGeneration: { total: totalEnergy },
      wasteProcessed: totalWasteProcessed,
      landfillSpaceSaved: landfillSpaceSaved,
      carbonImpact: { 
        direct: directCarbonAvoided,
        methaneAvoided: landfillMethaneAvoided,
        total: totalCarbonAvoided
      },
      economics: {
        totalInvestment,
        materialRecoveryRevenue,
        electricityRevenue,
        carbonCreditValue,
        totalRevenue,
        netAnnualRevenue: netAnnualValue,
        paybackPeriod,
        jobsCreated
      },
      circularEconomy: {
        resourceRecovery: {
          organics: usableFoodWaste + usableAgWaste,
          wood: usableForestWaste,
          recyclables: usableMSW * 0.3,
          energy: usableMSW * 0.7
        }
      }
    };
  }
  
  // Calculate Carbon Capture
  function calculateCarbonCapture(
    capacity, storagePercentage, fuelPercentage, 
    captureJobsFactor, captureCost
  ) {
    // Convert capacity from MT/year to tons
    const capacityTons = capacity * 1e6;
    
    // Calculate storage and fuel allocation
    const storageAllocation = capacityTons * (storagePercentage / 100);
    const fuelAllocation = capacityTons * (fuelPercentage / 100);
    
    // Investment calculation
    const totalInvestment = (capacityTons * captureCost) / 1e9; // in billions
    
    // Jobs calculation
    const jobsCreated = Math.round(capacity * captureJobsFactor);
    
    // Energy impact of carbon-to-fuels
    // Assuming 1 ton of CO2 can produce energy equivalent to 0.1 MWh
    const energyFromFuels = (fuelAllocation * 0.1) / 1e6; // in TWh
    
    // Carbon impact
    // For storage: 1 ton stored = 1 ton avoided
    // For fuels: 1 ton to fuels = 0.7 ton avoided (accounting for emissions from fuel use)
    const carbonAvoidedStorage = storageAllocation;
    const carbonAvoidedFuels = fuelAllocation * 0.7;
    const totalCarbonAvoided = (carbonAvoidedStorage + carbonAvoidedFuels) / 1e6; // in MT
    
    // Economic calculations
    const annualOperatingCost = totalInvestment * 0.08; // 8% of investment for operations
    const carbonCreditValue = (totalCarbonAvoided * 1e6 * 30) / 1e9; // $30 per ton, in billions
    const fuelValue = energyFromFuels * 50; // $50M per TWh
    const annualRevenue = carbonCreditValue + fuelValue;
    const netAnnualValue = annualRevenue - annualOperatingCost;
    const paybackPeriod = netAnnualValue > 0 ? totalInvestment / netAnnualValue : 0;
    
    return {
      capacity: capacity,
      storageAllocation: storageAllocation / 1e6, // in MT
      fuelAllocation: fuelAllocation / 1e6, // in MT
      energyFromFuels: energyFromFuels,
      carbonAvoided: totalCarbonAvoided,
      investment: totalInvestment,
      jobs: jobsCreated,
      economics: {
        annualOperatingCost,
        carbonCreditValue,
        fuelValue,
        annualRevenue,
        netAnnualValue,
        paybackPeriod
      }
    };
  }

  function generatePhasedPlan(
    effResults, solarResults, nuclearResults, hydroResults, 
    windResults, wasteResults, carbonCaptureResults, 
    implementationYears, speedFactor, effFirst
  ){
    // Calculate number of phases based on implementation years
    const numPhases = Math.min(10, Math.max(5, Math.ceil(implementationYears / 2)));
    
    // Generate phase factors arrays
    const effPhases = Array(numPhases).fill(0).map((_, i) => 
      Math.min(1.0, (i+1) / numPhases * 1.5));
    
    const genPhases = Array(numPhases).fill(0).map((_, i) => 
      Math.min(1.0, (i+1) / numPhases * 1.5));
    
    // Adjust based on efficiency-first or generation-first approach
    const phases = effFirst
      ? effPhases.map((effF, i) => {
          const year = 2025 + Math.floor(i * (implementationYears / numPhases));
          const genF = i <= 1 ? 0 : genPhases[i-2];
          return {
            year, phase: i+1,
            efficiencyFactor: effF,
            generationFactor: genF
          };
        })
      : genPhases.map((genF, i) => {
          const year = 2025 + Math.floor(i * (implementationYears / numPhases));
          const effF = i <= 1 ? 0 : effPhases[i-2];
          return {
            year, phase: i+1,
            efficiencyFactor: effF,
            generationFactor: genF
          };
        });
        
    return phases;
  }
  
  // Legacy implementation for compatibility
  function generateLegacyPhasedPlan(effResults, solarNuclearResults, windResults, wasteResults, effFirst){
    const effPhases = [0.05, 0.1, 0.2, 0.4, 0.7, 1.0];
    const genPhases = [0.0, 0.05, 0.2, 0.5, 0.8, 1.0];
    const speed = parseFloat(document.getElementById('implementation-speed').value);
    const speedFactor = speed / 10;
    const baseYearIncrement = 3 / speedFactor;

    // Separate out energies
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
      // Efficiency partial
      const effSaves = effResults.national.totalEnergySaved * p.efficiencyFactor;
      const effCO2   = effResults.national.totalCarbonReduction * p.efficiencyFactor;
      const effInv   = effResults.national.totalInvestment * p.efficiencyFactor;
      const effJobs  = effResults.national.jobsCreated * p.efficiencyFactor;

      // Renewables partial
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

  // TABLE for phased plan
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

  // CHARTS for the Dashboard
  let energyMixChart;
  function updateEnergyMixChart(solarResults, nuclearResults, hydroResults, windResults, wasteResults, carbonCaptureResults){
    // Create labels and data for all energy sources
    const labels = ["Solar", "Nuclear", "Hydro", "Wind", "Waste-to-Energy", "Carbon-to-Fuels"];
    const data = [
      solarResults.energyTWh,
      nuclearResults.energyTWh,
      hydroResults.energyTWh,
      windResults.totalEnergyTWh,
      wasteResults.energyGeneration.total,
      carbonCaptureResults.energyFromFuels
    ];
    const ctx = document.getElementById("energyMixChart").getContext("2d");

    if(energyMixChart){
      energyMixChart.data.labels = labels;
      energyMixChart.data.datasets[0].data = data;
      energyMixChart.update();
    } else {
      energyMixChart = new Chart(ctx, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: ["#2563eb","#6b21a8","#16a34a","#d97706","#b91c1c","#7c3aed"]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom"
            },
            title: {
              display: true,
              text: 'Energy Generation by Source (TWh)'
            }
          }
        }
      });
    }
  }
  
  // Jobs Distribution Chart
  let jobsDistributionChart;
  function updateJobsDistributionChart(effResults, solarResults, nuclearResults, hydroResults, windResults, wasteResults, carbonCaptureResults){
    const labels = ["Energy Efficiency", "Solar", "Nuclear", "Hydro", "Wind", "Waste Processing", "Carbon Capture"];
    const data = [
      effResults.national.jobsCreated,
      solarResults.jobs,
      nuclearResults.jobs,
      hydroResults.jobs,
      windResults.totalJobs,
      wasteResults.economics.jobsCreated,
      carbonCaptureResults.jobs
    ];
    const ctx = document.getElementById("jobsDistributionChart").getContext("2d");

    if(jobsDistributionChart){
      jobsDistributionChart.data.labels = labels;
      jobsDistributionChart.data.datasets[0].data = data;
      jobsDistributionChart.update();
    } else {
      jobsDistributionChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Jobs Created",
            data: data,
            backgroundColor: ["#2563eb","#3b82f6","#6b21a8","#16a34a","#84cc16","#d97706","#7c3aed"]
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Jobs'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Jobs Created by Sector'
            }
          }
        }
      });
    }
  }
  
  // Phased Implementation Chart
  let phasedImplementationChart;
  function updatePhasedImplementationChart(phased){
    const years = phased.map(p => p.year);
    const carbonReduction = phased.map(p => p.totals?.carbonReduction || 0);
    const jobs = phased.map(p => p.totals?.jobs / 1e6 || 0); // Convert to millions
    
    const ctx = document.getElementById("phasedImplementationChart").getContext("2d");
    
    if(phasedImplementationChart){
      phasedImplementationChart.data.labels = years;
      phasedImplementationChart.data.datasets[0].data = carbonReduction;
      phasedImplementationChart.data.datasets[1].data = jobs;
      phasedImplementationChart.update();
    } else {
      phasedImplementationChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: years,
          datasets: [
            {
              label: 'Carbon Reduction (MT)',
              data: carbonReduction,
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              yAxisID: 'y',
              fill: true
            },
            {
              label: 'Jobs Created (millions)',
              data: jobs,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              yAxisID: 'y1',
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Carbon Reduction (MT)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Jobs (millions)'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Phased Implementation Timeline'
            }
          }
        }
      });
    }
  }

  // EFFICIENCY UI
  // We'll fill a table with perHousehold data, plus a bar chart
  let efficiencyChart;
  function updateEfficiencyUI(effResults){
    // Fill the #efficiency-table with data
    const tBody = document.querySelector("#efficiency-table tbody");
    tBody.innerHTML = "";

    // Per-household
    const ph = effResults.perHousehold;
    // We'll show a few key fields:
    const rows = [
      ["Passive Solar Savings (kWh)", formatNumber(ph.passiveSolarSavings,0)],
      ["GSHP Heating Savings (kWh)", formatNumber(ph.gshpHeatingSavings,0)],
      ["GSHP Cooling Savings (kWh)", formatNumber(ph.gshpCoolingSavings,0)],
      ["HP Water Heater Savings (kWh)", formatNumber(ph.hpwhSavings,0)],
      ["HP Dryer Savings (kWh)", formatNumber(ph.drySavings,0)],
      ["Total Household Savings (kWh)", formatNumber(ph.totalSavings,0)],
      ["Reduction in Consumption (%)", formatNumber(ph.percentageReduction,1)+"%"],
      ["Annual Cost Savings ($)", "$"+formatNumber(ph.annualCostSavings,0)],
      ["Payback Period (years)", formatNumber(ph.paybackPeriod,1)],
    ];

    rows.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${item[0]}</td><td>${item[1]}</td>`;
      tBody.appendChild(tr);
    });

    // Efficiency bar chart
    const barLabels = ["Passive Solar","GSHP Heat","GSHP Cool","HP Water Heater","Dryer"];
    const barData = [
      ph.passiveSolarSavings,
      ph.gshpHeatingSavings,
      ph.gshpCoolingSavings,
      ph.hpwhSavings,
      ph.drySavings
    ];

    const ctx = document.getElementById("efficiencySavingsChart").getContext("2d");
    if(efficiencyChart){
      efficiencyChart.data.labels = barLabels;
      efficiencyChart.data.datasets[0].data = barData;
      efficiencyChart.update();
    } else {
      efficiencyChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: barLabels,
          datasets: [{
            label: "Household kWh Savings",
            data: barData,
            backgroundColor: "#2563eb"
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
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
    // Energy Efficiency
    const passiveSolarEff   = parseFloat(document.getElementById("passive-solar-efficiency").value);
    const gshpCOP           = parseFloat(document.getElementById("gshp-cop").value);
    const hpwhEff           = parseFloat(document.getElementById("hpwh-efficiency").value);
    const effAdoptionRate   = parseFloat(document.getElementById("efficiency-adoption-rate").value);
    const isNewConstruction = document.getElementById("new-construction-button").classList.contains("active");
    
    // Energy Generation
    const solarGW           = parseFloat(document.getElementById("solar-capacity").value);
    const solarCost         = parseFloat(document.getElementById("solar-cost").value);
    const solarJobsFactor   = parseFloat(document.getElementById("solar-jobs-factor").value);
    
    const traditionalWindGW = parseFloat(document.getElementById("traditional-wind-capacity").value);
    const skySailsUnits     = parseFloat(document.getElementById("skysails-units").value);
    const windJobsFactor    = parseFloat(document.getElementById("wind-jobs-factor").value);
    
    const hydroGW           = parseFloat(document.getElementById("hydro-capacity").value);
    const hydroCost         = parseFloat(document.getElementById("hydro-cost").value);
    const hydroJobsFactor   = parseFloat(document.getElementById("hydro-jobs-factor").value);
    
    const nuclearGW         = parseFloat(document.getElementById("nuclear-capacity").value);
    const nuclearCost       = parseFloat(document.getElementById("nuclear-cost").value);
    const nuclearJobsFactor = parseFloat(document.getElementById("nuclear-jobs-factor").value);
    
    const elecPrice         = parseFloat(document.getElementById("electricity-price").value);
    
    // Biomass & Waste
    const foodWasteUtil     = parseFloat(document.getElementById("food-waste-utilization").value);
    const agWasteUtil       = parseFloat(document.getElementById("agriculture-utilization").value);
    const forestUtil        = parseFloat(document.getElementById("forest-utilization").value);
    const mswUtil           = parseFloat(document.getElementById("msw-utilization").value);
    const algaeUtil         = parseFloat(document.getElementById("algae-percentage").value);
    const hempUtil          = parseFloat(document.getElementById("hemp-utilization").value);
    const biomassJobsFactor = parseFloat(document.getElementById("biomass-jobs-factor").value);
    
    // Carbon Capture
    const carbonCapacity    = parseFloat(document.getElementById("carbon-capture-capacity").value);
    const carbonStorage     = parseFloat(document.getElementById("carbon-storage-percentage").value);
    const carbonFuel        = parseFloat(document.getElementById("carbon-fuel-percentage").value);
    const carbonCaptureCost = parseFloat(document.getElementById("carbon-capture-cost").value);
    const carbonJobsFactor  = parseFloat(document.getElementById("carbon-capture-jobs-factor").value);
    
    // Implementation
    const implementationYears = parseFloat(document.getElementById("implementation-years").value);
    const speedValue        = parseFloat(document.getElementById("implementation-speed").value);
    const effFirst          = document.getElementById("efficiency-first-button").classList.contains("active");

    // Perform calculations
    const effResults = calculateEfficiencySavings(
      passiveSolarEff, gshpCOP, hpwhEff,
      effAdoptionRate, isNewConstruction, elecPrice
    );
    
    const solarResults = calculateSolarEnergy(
      solarGW, solarCost, solarJobsFactor, elecPrice
    );
    
    const nuclearResults = calculateNuclearEnergy(
      nuclearGW, nuclearCost, nuclearJobsFactor, elecPrice
    );
    
    const hydroResults = calculateHydroEnergy(
      hydroGW, hydroCost, hydroJobsFactor, elecPrice
    );
    
    const windResults = calculateWindEnergy(
      skySailsUnits, traditionalWindGW, windJobsFactor, elecPrice
    );
    
    const wasteResults = calculateWasteProcessing(
      foodWasteUtil, agWasteUtil, forestUtil,
      mswUtil, algaeUtil, hempUtil, biomassJobsFactor, elecPrice
    );
    
    const carbonCaptureResults = calculateCarbonCapture(
      carbonCapacity, carbonStorage, carbonFuel, 
      carbonJobsFactor, carbonCaptureCost
    );

    // Summaries
    // Energy calculations
    const totalCleanEnergy = solarResults.energyTWh + 
                            nuclearResults.energyTWh + 
                            hydroResults.energyTWh + 
                            windResults.totalEnergyTWh + 
                            wasteResults.energyGeneration.total +
                            carbonCaptureResults.energyFromFuels;
    
    // Carbon reduction calculations
    const totalCarbonReduction = effResults.national.totalCarbonReduction +
                                solarResults.carbonAvoided +
                                nuclearResults.carbonAvoided +
                                hydroResults.carbonAvoided +
                                windResults.carbonAvoided +
                                wasteResults.carbonImpact.total +
                                carbonCaptureResults.carbonAvoided;
    
    // Landfill space calculations
    const landfillSpaceSaved = wasteResults.landfillSpaceSaved;
    const totalUSLandfillSpace = 5e9; // 5 billion cubic yards (placeholder)
    const percentLandfillSaved = (landfillSpaceSaved / totalUSLandfillSpace) * 100;
    
    // Energy impact
    const netEnergyImpact = totalCleanEnergy - effResults.national.totalEnergySaved;
    
    // Investment calculations
    const totalInvestment = effResults.national.totalInvestment +
                           solarResults.investment +
                           nuclearResults.investment +
                           hydroResults.investment +
                           windResults.totalInvestment +
                           wasteResults.economics.totalInvestment +
                           carbonCaptureResults.investment;
    
    // Jobs calculations
    const totalJobs = effResults.national.jobsCreated +
                     solarResults.jobs +
                     nuclearResults.jobs +
                     hydroResults.jobs +
                     windResults.totalJobs +
                     wasteResults.economics.jobsCreated +
                     carbonCaptureResults.jobs;
    
    // Economic calculations
    const annualBenefits = effResults.national.annualSavings +
                          solarResults.netAnnualRevenue +
                          nuclearResults.netAnnualRevenue +
                          hydroResults.netAnnualRevenue +
                          windResults.netAnnualRevenue +
                          wasteResults.economics.netAnnualRevenue +
                          carbonCaptureResults.economics.netAnnualValue;
    
    const payback = (totalInvestment > 0 && annualBenefits > 0) ? (totalInvestment / annualBenefits) : 0;
    const percentEmissionsReduced = (totalCarbonReduction / 5222) * 100;

    // Update Dashboard
    // Energy efficiency impact
    document.getElementById("energy-efficiency-impact").textContent =
      `${formatNumber(effResults.national.totalEnergySaved,2)} TWh`;
    document.getElementById("efficiency-percent").textContent =
      `${formatNumber(effResults.national.totalEnergySaved/3800*100,2)}% reduction`;
      
    // Net energy impact
    document.getElementById("net-energy-impact").textContent =
      `${formatNumber(netEnergyImpact,2)} TWh`;
    document.getElementById("net-energy-percent").textContent =
      `${formatNumber((netEnergyImpact/3800)*100,2)}% of US consumption`;
      
    // Carbon reduction
    document.getElementById("carbon-reduction").textContent =
      `${formatNumber(totalCarbonReduction,2)} MT`;
    document.getElementById("carbon-percent").textContent =
      `${formatNumber(percentEmissionsReduced,2)}% of US emissions`;
      
    // Landfill space
    document.getElementById("landfill-space-saved").textContent =
      `${formatNumber(landfillSpaceSaved,0)} cubic yards`;
    document.getElementById("landfill-percent").textContent =
      `${formatNumber(percentLandfillSaved,2)}% reduction`;
      
    // Investment
    document.getElementById("total-investment").textContent =
      `$${formatNumber(totalInvestment,2)} B`;
    document.getElementById("payback-period").textContent =
      `Payback: ${formatNumber(payback,1)} years`;
      
    // Jobs
    document.getElementById("jobs-created").textContent =
      `${formatNumber(totalJobs/1e6,1)}M`;
    if(totalInvestment>0){
      document.getElementById("jobs-per-million").textContent =
        `${formatNumber(totalJobs/(totalInvestment*1000),1)} jobs per $1M`;
    } else {
      document.getElementById("jobs-per-million").textContent = "-";
    }

    // Update Energy Mix Chart
    updateEnergyMixChart(solarResults, nuclearResults, hydroResults, windResults, wasteResults, carbonCaptureResults);
    
    // Update Jobs Distribution Chart
    updateJobsDistributionChart(effResults, solarResults, nuclearResults, hydroResults, windResults, wasteResults, carbonCaptureResults);
    
    // Generate and update phased plan
    const phased = generatePhasedPlan(
      effResults, solarResults, nuclearResults, hydroResults,
      windResults, wasteResults, carbonCaptureResults,
      implementationYears, speedValue/10, effFirst
    );
    updatePhasedPlanTable(phased);
    updatePhasedImplementationChart(phased);
    
    // Update Efficiency UI
    updateEfficiencyUI(effResults);
    
    // Update Circular Economy UI
    updateCircularEconomyUI(wasteResults);
    
    // Update Carbon Capture UI
    updateCarbonCaptureUI(carbonCaptureResults);
  }

  // Circular Economy UI
  let materialFlowChart, resourceRecoveryChart;
  function updateCircularEconomyUI(wasteResults) {
    // Update the circular economy table
    const tBody = document.querySelector("#circular-economy-table tbody");
    tBody.innerHTML = "";
    
    const rows = [
      ["Total Waste Processed (million tons)", formatNumber(wasteResults.wasteProcessed, 2)],
      ["Landfill Space Saved (cubic yards)", formatNumber(wasteResults.landfillSpaceSaved, 0)],
      ["Material Recovery Revenue ($B)", formatNumber(wasteResults.economics.materialRecoveryRevenue, 2)],
      ["Energy Generation (TWh)", formatNumber(wasteResults.energyGeneration.total, 2)],
      ["Carbon Avoided - Direct (MT)", formatNumber(wasteResults.carbonImpact.direct, 2)],
      ["Carbon Avoided - Methane (MT)", formatNumber(wasteResults.carbonImpact.methaneAvoided, 2)],
      ["Total Carbon Impact (MT)", formatNumber(wasteResults.carbonImpact.total, 2)]
    ];
    
    rows.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${item[0]}</td><td>${item[1]}</td>`;
      tBody.appendChild(tr);
    });
    
    // Material Flow Chart
    const materialCtx = document.getElementById("materialFlowChart").getContext("2d");
    const materialLabels = ["Food Waste", "Agricultural Waste", "Forest Residues", "Municipal Solid Waste"];
    const materialData = [
      wasteResults.circularEconomy.resourceRecovery.organics * 0.1, // Approximate food waste portion
      wasteResults.circularEconomy.resourceRecovery.organics * 0.9, // Approximate ag waste portion
      wasteResults.circularEconomy.resourceRecovery.wood,
      wasteResults.circularEconomy.resourceRecovery.energy + wasteResults.circularEconomy.resourceRecovery.recyclables
    ];
    
    if(materialFlowChart) {
      materialFlowChart.data.datasets[0].data = materialData;
      materialFlowChart.update();
    } else {
      materialFlowChart = new Chart(materialCtx, {
        type: 'pie',
        data: {
          labels: materialLabels,
          datasets: [{
            data: materialData,
            backgroundColor: ["#f59e0b", "#84cc16", "#15803d", "#6b7280"]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Waste Material Flow (tons)'
            }
          }
        }
      });
    }
    
    // Resource Recovery Chart
    const recoveryCtx = document.getElementById("resourceRecoveryChart").getContext("2d");
    const recoveryLabels = ["Energy Recovery", "Material Recovery", "Recyclables"];
    const recoveryData = [
      wasteResults.circularEconomy.resourceRecovery.energy,
      wasteResults.circularEconomy.resourceRecovery.organics + wasteResults.circularEconomy.resourceRecovery.wood,
      wasteResults.circularEconomy.resourceRecovery.recyclables
    ];
    
    if(resourceRecoveryChart) {
      resourceRecoveryChart.data.datasets[0].data = recoveryData;
      resourceRecoveryChart.update();
    } else {
      resourceRecoveryChart = new Chart(recoveryCtx, {
        type: 'doughnut',
        data: {
          labels: recoveryLabels,
          datasets: [{
            data: recoveryData,
            backgroundColor: ["#dc2626", "#2563eb", "#16a34a"]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Resource Recovery Distribution'
            }
          }
        }
      });
    }
  }
  
  // Carbon Capture UI
  let carbonCaptureChart, carbonTimelineChart;
  function updateCarbonCaptureUI(carbonCaptureResults) {
    // Update the carbon capture table
    const tBody = document.querySelector("#carbon-capture-table tbody");
    tBody.innerHTML = "";
    
    const rows = [
      ["Total Capture Capacity (MT/year)", formatNumber(carbonCaptureResults.capacity, 2)],
      ["Underground Storage (MT/year)", formatNumber(carbonCaptureResults.storageAllocation, 2)],
      ["Carbon to Fuels (MT/year)", formatNumber(carbonCaptureResults.fuelAllocation, 2)],
      ["Energy from Carbon Fuels (TWh)", formatNumber(carbonCaptureResults.energyFromFuels, 2)],
      ["Total Carbon Avoided (MT)", formatNumber(carbonCaptureResults.carbonAvoided, 2)],
      ["Total Investment ($B)", formatNumber(carbonCaptureResults.investment, 2)],
      ["Jobs Created", formatNumber(carbonCaptureResults.jobs, 0)],
      ["Annual Revenue ($B)", formatNumber(carbonCaptureResults.economics.annualRevenue, 2)],
      ["Payback Period (years)", formatNumber(carbonCaptureResults.economics.paybackPeriod, 1)]
    ];
    
    rows.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${item[0]}</td><td>${item[1]}</td>`;
      tBody.appendChild(tr);
    });
    
    // Carbon Capture Allocation Chart
    const captureCtx = document.getElementById("carbonCaptureChart").getContext("2d");
    const captureLabels = ["Underground Storage", "Carbon to Fuels"];
    const captureData = [
      carbonCaptureResults.storageAllocation,
      carbonCaptureResults.fuelAllocation
    ];
    
    if(carbonCaptureChart) {
      carbonCaptureChart.data.datasets[0].data = captureData;
      carbonCaptureChart.update();
    } else {
      carbonCaptureChart = new Chart(captureCtx, {
        type: 'pie',
        data: {
          labels: captureLabels,
          datasets: [{
            data: captureData,
            backgroundColor: ["#1e40af", "#7c3aed"]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Carbon Capture Allocation (MT)'
            }
          }
        }
      });
    }
    
    // Carbon Timeline Chart - Simplified projection over 10 years
    const timelineCtx = document.getElementById("carbonTimelineChart").getContext("2d");
    const years = Array.from({length: 10}, (_, i) => 2025 + i);
    const cumulativeCapture = years.map((_, i) => carbonCaptureResults.capacity * (i + 1));
    
    if(carbonTimelineChart) {
      carbonTimelineChart.data.labels = years;
      carbonTimelineChart.data.datasets[0].data = cumulativeCapture;
      carbonTimelineChart.update();
    } else {
      carbonTimelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: {
          labels: years,
          datasets: [{
            label: 'Cumulative Carbon Captured (MT)',
            data: cumulativeCapture,
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            fill: true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Carbon Captured (MT)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Year'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Projected Carbon Capture Timeline'
            }
          }
        }
      });
    }
  }
  
  // Share functionality
  function setupShareButton() {
    const shareButton = document.getElementById("share-button");
    if (shareButton) {
      shareButton.addEventListener("click", function() {
        // Create a summary of results
        const summary = {
          energyEfficiency: document.getElementById("energy-efficiency-impact").textContent,
          netEnergyImpact: document.getElementById("net-energy-impact").textContent,
          carbonReduction: document.getElementById("carbon-reduction").textContent,
          landfillSaved: document.getElementById("landfill-space-saved").textContent,
          jobsCreated: document.getElementById("jobs-created").textContent,
          investment: document.getElementById("total-investment").textContent
        };
        
        // Create share text
        const shareText = `Check out my Circular Economy Waste-to-Energy Calculator results:
- Energy Efficiency: ${summary.energyEfficiency}
- Net Energy Impact: ${summary.netEnergyImpact}
- Carbon Reduction: ${summary.carbonReduction}
- Landfill Space Saved: ${summary.landfillSaved}
- Jobs Created: ${summary.jobsCreated}
- Total Investment: ${summary.investment}`;
        
        // Try to use Web Share API if available
        if (navigator.share) {
          navigator.share({
            title: 'Circular Economy Calculator Results',
            text: shareText,
          })
          .catch(error => {
            console.error('Error sharing:', error);
            fallbackShare();
          });
        } else {
          fallbackShare();
        }
        
        // Fallback to clipboard
        function fallbackShare() {
          // Create a temporary textarea to copy the text
          const textarea = document.createElement('textarea');
          textarea.value = shareText;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          
          alert('Results copied to clipboard! You can now paste and share them.');
        }
      });
    }
  }

  // EVENT LISTENERS
  document.getElementById("apply-parameters-button").addEventListener("click", updateCalculations);
  setupShareButton();

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

  // INITIAL RUN
  updateCalculations();
});
