document.addEventListener("DOMContentLoaded", function(){

  // ========================
  // 1. REAL-TIME SLIDER VALUE UPDATES & INITIAL DISPLAY
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

  function formatDisplayValue(id, value) {
    let val = value;
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
    } else if (id === 'gshp-cop') {
        val = `${parseFloat(val).toFixed(1)}`;
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
    } else if (id === 'biomass-jobs-factor' || id === 'carbon-capture-jobs-factor') {
        val = `${parseInt(val).toLocaleString()}`;
    }
    return val;
  }

  parameterSliders.forEach(id => {
    const slider = document.getElementById(id);
    const displaySpan = document.getElementById(`${id}-value`);
    if (slider && displaySpan) {
      // Set initial display value on load
      displaySpan.textContent = formatDisplayValue(id, slider.value);
      // Add listener for changes
      slider.addEventListener('input', () => {
        displaySpan.textContent = formatDisplayValue(id, slider.value);
        // Optional: Add debounced update here if needed for performance
        // debouncedUpdateCalculations();
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
      // Update active link style
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      // Show target section, hide others
      document.querySelectorAll(".content-section").forEach(section => {
        if (section.id === target) {
          section.classList.add("active");
        } else {
          section.classList.remove("active");
        }
      });
    });
  });
  // Activate the first link/section by default
  if (navLinks.length > 0) {
    navLinks[0].classList.add('active');
    const firstTarget = navLinks[0].getAttribute('data-target');
    document.getElementById(firstTarget)?.classList.add('active');
  }


  // ========================
  // 3. TOGGLE BUTTONS
  // ========================
  function setupTogglePair(button1Id, button2Id) {
      const btn1 = document.getElementById(button1Id);
      const btn2 = document.getElementById(button2Id);
      if (btn1 && btn2) {
          btn1.addEventListener('click', function(){
              this.classList.add('active');
              btn2.classList.remove('active');
              updateCalculations(); // Update on toggle change
          });
          btn2.addEventListener('click', function(){
              this.classList.add('active');
              btn1.classList.remove('active');
              updateCalculations(); // Update on toggle change
          });
      }
  }
  setupTogglePair('retrofit-button', 'new-construction-button');
  setupTogglePair('efficiency-first-button', 'generation-first-button');


  // ========================
  // 4. CALCULATION FUNCTIONS
  // ========================

  // Calculate Solar Energy
  function calculateSolarEnergy(solarGW, solarCost, solarJobsFactor, electricityPrice) {
    const hoursPerYear = 8760;
    const solarCF = 0.25; // Capacity Factor

    const solarEnergyTWh = (solarGW * hoursPerYear * solarCF) / 1000;
    const solarInvestment = (solarGW * 1e6 * solarCost) / 1e9; // Billion $
    const jobs = Math.round(solarGW * 1000 * solarJobsFactor);
    const carbonAvoided = solarEnergyTWh * 0.417; // MT CO2 avoided (using avg grid intensity)

    const annualRevenue = (solarEnergyTWh * 1e9 * (electricityPrice / 100)) / 1e9; // Billion $
    const operatingCost = solarInvestment * 0.02; // Assume 2% O&M
    const netAnnualRevenue = annualRevenue - operatingCost;
    let payback = netAnnualRevenue > 0 ? solarInvestment / netAnnualRevenue : Infinity;

    return { energyTWh: solarEnergyTWh, investment: solarInvestment, jobs, carbonAvoided, netAnnualRevenue, payback };
  }

  // Calculate Nuclear Energy
  function calculateNuclearEnergy(nuclearGW, nuclearCost, nuclearJobsFactor, electricityPrice) {
    const hoursPerYear = 8760;
    const nuclearCF = 0.90; // Capacity Factor

    const nuclearEnergyTWh = (nuclearGW * hoursPerYear * nuclearCF) / 1000;
    const nuclearInvestment = (nuclearGW * 1e6 * nuclearCost) / 1e9; // Billion $
    const jobs = Math.round(nuclearGW * 1000 * nuclearJobsFactor);
    const carbonAvoided = nuclearEnergyTWh * 0.417; // MT CO2 avoided

    const annualRevenue = (nuclearEnergyTWh * 1e9 * (electricityPrice / 100)) / 1e9; // Billion $
    const operatingCost = nuclearInvestment * 0.04; // Assume 4% O&M
    const netAnnualRevenue = annualRevenue - operatingCost;
    let payback = netAnnualRevenue > 0 ? nuclearInvestment / netAnnualRevenue : Infinity;

    return { energyTWh: nuclearEnergyTWh, investment: nuclearInvestment, jobs, carbonAvoided, netAnnualRevenue, payback };
  }

  // Calculate Hydro Energy
  function calculateHydroEnergy(hydroGW, hydroCost, hydroJobsFactor, electricityPrice) {
    const hoursPerYear = 8760;
    const hydroCF = 0.40; // Capacity Factor

    const hydroEnergyTWh = (hydroGW * hoursPerYear * hydroCF) / 1000;
    const hydroInvestment = (hydroGW * 1e6 * hydroCost) / 1e9; // Billion $
    const jobs = Math.round(hydroGW * 1000 * hydroJobsFactor);
    const carbonAvoided = hydroEnergyTWh * 0.417; // MT CO2 avoided

    const annualRevenue = (hydroEnergyTWh * 1e9 * (electricityPrice / 100)) / 1e9; // Billion $
    const operatingCost = hydroInvestment * 0.025; // Assume 2.5% O&M
    const netAnnualRevenue = annualRevenue - operatingCost;
    let payback = netAnnualRevenue > 0 ? hydroInvestment / netAnnualRevenue : Infinity;

    return { energyTWh: hydroEnergyTWh, investment: hydroInvestment, jobs, carbonAvoided, netAnnualRevenue, payback };
  }

  // Calculate Wind Energy (SkySails + Traditional)
  function calculateWindEnergy(skySailsUnits, traditionalWindGW, windJobsFactor, electricityPrice) {
    const hoursPerYear = 8760;
    // SkySails assumptions
    const skySailsCapacityMW = 0.2; // MW per unit
    const skySailsCF = 0.75; // Capacity Factor (optimistic)
    const skySailsCostPerUnit = 1000; // $ per unit (placeholder)
    const skySailsJobsPerUnit = 3; // Jobs per unit (placeholder)

    // Traditional Wind assumptions
    const traditionalWindCF = 0.35; // Capacity Factor
    const traditionalWindCostPerKW = 1500; // $/kW

    const skySailsEnergyTWh = skySailsUnits * (skySailsCapacityMW * hoursPerYear * skySailsCF) / 1e6;
    const traditionalWindEnergyTWh = (traditionalWindGW * hoursPerYear * traditionalWindCF) / 1000;
    const totalWindEnergyTWh = skySailsEnergyTWh + traditionalWindEnergyTWh;

    const skySailsInvestment = (skySailsUnits * skySailsCostPerUnit) / 1e9; // Billion $
    const traditionalWindInvestment = (traditionalWindGW * 1e6 * traditionalWindCostPerKW) / 1e9; // Billion $
    const totalInvestment = skySailsInvestment + traditionalWindInvestment;

    const skySailsJobs = skySailsUnits * skySailsJobsPerUnit;
    const traditionalWindJobs = Math.round(traditionalWindGW * 1000 * windJobsFactor);
    const totalJobs = skySailsJobs + traditionalWindJobs;
    const carbonAvoided = totalWindEnergyTWh * 0.417; // MT CO2 avoided

    const annualRevenue = (totalWindEnergyTWh * 1e9 * (electricityPrice / 100)) / 1e9; // Billion $
    const operatingCost = totalInvestment * 0.03; // Assume 3% O&M
    const netAnnualRevenue = annualRevenue - operatingCost;
    let payback = netAnnualRevenue > 0 ? totalInvestment / netAnnualRevenue : Infinity;

    return {
      totalEnergyTWh: totalWindEnergyTWh,
      totalInvestment: totalInvestment,
      totalJobs: totalJobs,
      carbonAvoided: carbonAvoided,
      netAnnualRevenue: netAnnualRevenue,
      payback: payback
    };
  }

  // Calculate Waste Processing (Biomass, MSW, Algae, Hemp)
  function calculateWasteProcessing(foodWasteUtil, agWasteUtil, forestUtil, mswUtil, algaeUtil, hempUtil, biomassJobsFactor, electricityPrice) {
    // Available waste in Million Tons/year (Source: NREL, EPA estimates)
    const availableFoodWasteMT = 63;
    const availableAgWasteMT = 800;
    const availableForestWasteMT = 93;
    const availableMSW_MT = 292; // Total MSW generated, assume portion is combustible

    // Energy potential (TWh per Million Ton) - Simplified estimates
    const foodWasteEnergyFactor = 1.5 / 1e6; // TWh/MT (via anaerobic digestion/gasification)
    const agWasteEnergyFactor = 1.2 / 1e6; // TWh/MT
    const forestWasteEnergyFactor = 2.0 / 1e6; // TWh/MT
    const mswEnergyFactor = 0.6 / 1e6; // TWh/MT (for combustible portion)

    // Algae & Hemp - Base potential (TWh) assuming certain scale/yield
    const baseAlgaeEnergyTWh = 28 * 4; // Placeholder TWh potential at 100% scale
    const baseHempEnergyTWh = 3.3 * 2; // Placeholder TWh potential at 100% scale

    const usableFoodWasteMT = availableFoodWasteMT * (foodWasteUtil / 100);
    const usableAgWasteMT = availableAgWasteMT * (agWasteUtil / 100);
    const usableForestWasteMT = availableForestWasteMT * (forestUtil / 100);
    const usableMSW_MT = availableMSW_MT * (mswUtil / 100); // Assume utilization applies to combustible fraction

    const totalWasteProcessedMT = usableFoodWasteMT + usableAgWasteMT + usableForestWasteMT + usableMSW_MT;

    const foodWasteEnergyTWh = usableFoodWasteMT * foodWasteEnergyFactor;
    const agWasteEnergyTWh = usableAgWasteMT * agWasteEnergyFactor;
    const forestWasteEnergyTWh = usableForestWasteMT * forestWasteEnergyFactor;
    const mswEnergyTWh = usableMSW_MT * mswEnergyFactor;
    const algaeEnergyTWh = baseAlgaeEnergyTWh * (algaeUtil / 100);
    const hempEnergyTWh = baseHempEnergyTWh * (hempUtil / 100);

    const totalEnergyTWh = foodWasteEnergyTWh + agWasteEnergyTWh + forestWasteEnergyTWh + mswEnergyTWh + algaeEnergyTWh + hempEnergyTWh;

    // Economic calculations (Placeholders)
    const investmentPerMT = 50; // Million $/MT processed capacity (very rough estimate)
    const totalInvestment = (totalWasteProcessedMT * investmentPerMT) / 1000; // Billion $
    const electricityRevenue = (totalEnergyTWh * 1e9 * (electricityPrice / 100)) / 1e9; // Billion $
    const materialRecoveryRevenue = totalWasteProcessedMT * 50 / 1000; // Assume $50/ton recovery value -> Billion $
    const operatingCost = totalInvestment * 0.05; // Assume 5% O&M

    // Carbon credits/avoided landfill emissions (Placeholder)
    const carbonCreditValue = (totalEnergyTWh * 0.417 + (usableFoodWasteMT * 0.5 + usableMSW_MT * 0.3)) * 30 / 1000; // Billion $ (Avoided grid + landfill methane)

    const netAnnualValue = electricityRevenue + materialRecoveryRevenue + carbonCreditValue - operatingCost;
    const jobsCreated = Math.round(totalWasteProcessedMT * biomassJobsFactor); // Jobs per Million Ton processed

    // Landfill savings
    const landfillDensityLbsPerCuYd = 1200;
    const tonsToLbs = 2000;
    const landfillSpaceSavedCuYds = (totalWasteProcessedMT * 1e6 * tonsToLbs) / landfillDensityLbsPerCuYd;

    return {
      energyGeneration: { total: totalEnergyTWh },
      wasteProcessedMT: totalWasteProcessedMT,
      landfillSpaceSaved: landfillSpaceSavedCuYds,
      economics: {
        totalInvestment: totalInvestment,
        netAnnualRevenue: netAnnualValue,
        jobsCreated: jobsCreated
      }
    };
  }

  // Calculate Energy Efficiency Savings
  function calculateEfficiencySavings(passiveSolarEff, gshpCOP, hpwhEff, effAdoptionRate, isNewConstruction, elecPrice) {
    const originalConsumption = 10715; // kWh/year for average household
    const households = 129900000; // US households

    // Savings potential per household (kWh/year) - based on typical splits
    const heatingCoolingShare = 4500; // kWh for heating/cooling
    const waterHeatingShare = 1928; // kWh for water heating

    // Calculate savings from each measure
    const passiveSolarSavings = heatingCoolingShare * (passiveSolarEff / 100);
    // GSHP saves on the remaining heating/cooling load
    const gshpSavings = (heatingCoolingShare - passiveSolarSavings) * (1 - 1/gshpCOP);
    // HPWH saves on water heating load
    const hpwhSavings = waterHeatingShare * (1 - 1/hpwhEff);

    const totalSavingsPerHouse = passiveSolarSavings + gshpSavings + hpwhSavings;
    const totalNationalSavingsTWh = (totalSavingsPerHouse * households * (effAdoptionRate / 100)) / 1e9; // TWh

    // Cost/Investment (Placeholders - highly variable)
    const costPassiveSolar = isNewConstruction ? 5000 : 15000; // $ per house
    const costGSHP = 20000; // $ per house
    const costHPWH = 1500; // $ per house
    const totalCostPerHouse = costPassiveSolar + costGSHP + costHPWH;
    const totalNationalInvestment = (totalCostPerHouse * households * (effAdoptionRate / 100)) / 1e9; // Billion $

    // Payback (Simplified - based on energy savings vs investment)
    const annualSavingsPerHouseUSD = (totalSavingsPerHouse * (elecPrice / 100));
    let payback = annualSavingsPerHouseUSD > 0 ? totalCostPerHouse / annualSavingsPerHouseUSD : Infinity;

    // Jobs (Placeholder)
    const jobsPerMillionUSD = 10; // Jobs per $1M invested
    const jobsCreated = Math.round(totalNationalInvestment * 1000 * jobsPerMillionUSD);

    return {
      perHouseSavings: totalSavingsPerHouse,
      nationalSavingsTWh: totalNationalSavingsTWh,
      percentageReduction: (totalSavingsPerHouse / originalConsumption * 100),
      investment: totalNationalInvestment,
      payback: payback,
      jobs: jobsCreated,
      // For table breakdown:
      passiveSolarSavingsPerHouse: passiveSolarSavings,
      gshpSavingsPerHouse: gshpSavings,
      hpwhSavingsPerHouse: hpwhSavings
    };
  }

  // Calculate Carbon Capture
  function calculateCarbonCapture(capacityMT, storagePercent, fuelPercent, costPerTon, jobsFactor) {
    const storedCO2 = capacityMT * (storagePercent / 100);
    // Assume fuel conversion avoids 70% of emissions compared to fossil fuel
    const effectiveFuelCO2Reduction = capacityMT * (fuelPercent / 100) * 0.7;
    const totalCO2Reduction = storedCO2 + effectiveFuelCO2Reduction;

    const investment = (capacityMT * costPerTon) / 1e9; // Billion $
    const jobs = Math.round(capacityMT * jobsFactor);

    return {
        totalReductionMT: totalCO2Reduction,
        storedMT: storedCO2,
        fuelConversionMT: capacityMT * (fuelPercent / 100), // Actual amount converted
        investment: investment,
        jobs: jobs
    };
  }

  // ========================
  // 5. MAIN UPDATE FUNCTION
  // ========================
  function updateCalculations() {
    // Get all input values
    const inputs = {};
    parameterSliders.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            inputs[id.replace(/-/g, '_')] = parseFloat(element.value); // Store with underscore names
        }
    });
    // Add toggle button states
    inputs.is_new_construction = document.getElementById("new-construction-button").classList.contains("active");
    inputs.is_efficiency_first = document.getElementById("efficiency-first-button").classList.contains("active");

    // Perform calculations
    const efficiencyResults = calculateEfficiencySavings(
      inputs.passive_solar_efficiency, inputs.gshp_cop, inputs.hpwh_efficiency,
      inputs.efficiency_adoption_rate, inputs.is_new_construction, inputs.electricity_price
    );

    const solarResults = calculateSolarEnergy(inputs.solar_capacity, inputs.solar_cost, inputs.solar_jobs_factor, inputs.electricity_price);
    const nuclearResults = calculateNuclearEnergy(inputs.nuclear_capacity, inputs.nuclear_cost, inputs.nuclear_jobs_factor, inputs.electricity_price);
    const hydroResults = calculateHydroEnergy(inputs.hydro_capacity, inputs.hydro_cost, inputs.hydro_jobs_factor, inputs.electricity_price);
    const windResults = calculateWindEnergy(inputs.skysails_units, inputs.traditional_wind_capacity, inputs.wind_jobs_factor, inputs.electricity_price);
    const wasteResults = calculateWasteProcessing(
        inputs.food_waste_utilization, inputs.agriculture_utilization, inputs.forest_utilization,
        inputs.msw_utilization, inputs.algae_percentage, inputs.hemp_utilization,
        inputs.biomass_jobs_factor, inputs.electricity_price
    );
    const carbonResults = calculateCarbonCapture(
        inputs.carbon_capture_capacity, inputs.carbon_storage_percentage, inputs.carbon_fuel_percentage,
        inputs.carbon_capture_cost, inputs.carbon_capture_jobs_factor
    );

    // Aggregate results for Dashboard
    const totalGeneratedEnergy = solarResults.energyTWh + nuclearResults.energyTWh + hydroResults.energyTWh + windResults.totalEnergyTWh + wasteResults.energyGeneration.total;
    const netEnergyImpact = totalGeneratedEnergy - efficiencyResults.nationalSavingsTWh; // Generation minus savings
    const totalInvestment = efficiencyResults.investment + solarResults.investment + nuclearResults.investment + hydroResults.investment + windResults.totalInvestment + wasteResults.economics.totalInvestment + carbonResults.investment;
    const totalJobs = efficiencyResults.jobs + solarResults.jobs + nuclearResults.jobs + hydroResults.jobs + windResults.totalJobs + wasteResults.economics.jobsCreated + carbonResults.jobs;
    const totalCarbonReduction = efficiencyResults.nationalSavingsTWh * 0.417 + // Savings replace grid mix
                                 solarResults.carbonAvoided + nuclearResults.carbonAvoided + hydroResults.carbonAvoided + windResults.carbonAvoided +
                                 carbonResults.totalReductionMT; // Direct capture/utilization reduction
    const totalLandfillSaved = wasteResults.landfillSpaceSaved;

    // Calculate overall payback (Weighted average or total investment / total net revenue) - Simplified
    const totalNetAnnualRevenue = efficiencyResults.nationalSavingsTWh * 1e9 * (inputs.electricity_price / 100) / 1e9 + // Value of saved energy
                                  solarResults.netAnnualRevenue + nuclearResults.netAnnualRevenue + hydroResults.netAnnualRevenue + windResults.netAnnualRevenue +
                                  wasteResults.economics.netAnnualRevenue; // Revenue from waste processing (includes energy, materials, credits)
                                  // Note: Carbon capture revenue/cost is complex, omitted here for simplicity
    let overallPayback = totalNetAnnualRevenue > 0 ? totalInvestment / totalNetAnnualRevenue : Infinity;


    // Update Dashboard Display
    document.getElementById("energy-efficiency-impact").textContent = `${efficiencyResults.nationalSavingsTWh.toFixed(2)} TWh`;
    document.getElementById("efficiency-percent").textContent = `${efficiencyResults.percentageReduction.toFixed(1)}% reduction`;

    document.getElementById("net-energy-impact").textContent = `${netEnergyImpact.toFixed(2)} TWh`;
    // Assuming US consumption ~4000 TWh for percentage calculation
    document.getElementById("net-energy-percent").textContent = `${((netEnergyImpact / 4000) * 100).toFixed(1)}% of US consumption`;

    document.getElementById("carbon-reduction").textContent = `${totalCarbonReduction.toFixed(2)} MT`;
     // Assuming US emissions ~5000 MT CO2e for percentage calculation
    document.getElementById("carbon-percent").textContent = `${((totalCarbonReduction / 5000) * 100).toFixed(1)}% of US emissions`;

    document.getElementById("landfill-space-saved").textContent = `${totalLandfillSaved.toLocaleString(undefined, {maximumFractionDigits: 0})} cubic yards`;
    // Assuming total landfill ~146M tons/yr, ~243M cubic yards/yr
    document.getElementById("landfill-percent").textContent = `${((totalLandfillSaved / 243e6) * 100).toFixed(1)}% reduction`;

    document.getElementById("total-investment").textContent = `$${totalInvestment.toFixed(2)} B`;
    document.getElementById("payback-period").textContent = `Payback: ${overallPayback === Infinity ? 'N/A' : overallPayback.toFixed(1)} years`;

    document.getElementById("jobs-created").textContent = `${totalJobs.toLocaleString()}`;
    const jobsPerMillion = totalInvestment > 0 ? (totalJobs / (totalInvestment * 1000)).toFixed(1) : 0;
    document.getElementById("jobs-per-million").textContent = `${jobsPerMillion} jobs per $1M`;


    // Update Energy Efficiency Details Table
    const efficiencyTbody = document.querySelector("#efficiency-table tbody");
    if (efficiencyTbody) {
        efficiencyTbody.innerHTML = ""; // Clear previous rows
        [
            ["Passive Solar Savings (per house)", `${efficiencyResults.passiveSolarSavingsPerHouse.toFixed(0)} kWh`],
            ["GSHP Savings (per house)", `${efficiencyResults.gshpSavingsPerHouse.toFixed(0)} kWh`],
            ["HPWH Savings (per house)", `${efficiencyResults.hpwhSavingsPerHouse.toFixed(0)} kWh`],
            ["Total Savings (per house)", `${efficiencyResults.perHouseSavings.toFixed(0)} kWh (${efficiencyResults.percentageReduction.toFixed(1)}%)`],
            ["National Savings (Total)", `${efficiencyResults.nationalSavingsTWh.toFixed(2)} TWh`],
            ["Estimated Investment", `$${efficiencyResults.investment.toFixed(2)} B`],
            ["Estimated Payback", `${efficiencyResults.payback === Infinity ? 'N/A' : efficiencyResults.payback.toFixed(1)} years`],
            ["Estimated Jobs Created", `${efficiencyResults.jobs.toLocaleString()}`]
        ].forEach(([label, value]) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${label}</td><td>${value}</td>`;
            efficiencyTbody.appendChild(row);
        });
    }

    // Update Circular Economy Table
    const circularTbody = document.querySelector("#circular-economy-table tbody");
     if (circularTbody) {
        circularTbody.innerHTML = "";
        [
          ["Total Waste Processed", `${wasteResults.wasteProcessedMT.toFixed(2)} M tons`],
          ["Energy from Waste", `${wasteResults.energyGeneration.total.toFixed(2)} TWh`],
          ["Landfill Space Saved", `${wasteResults.landfillSpaceSaved.toLocaleString(undefined, {maximumFractionDigits: 0})} cubic yards`],
          ["Estimated Investment", `$${wasteResults.economics.totalInvestment.toFixed(2)} B`],
          ["Net Annual Revenue/Value", `$${wasteResults.economics.netAnnualRevenue.toFixed(2)} B`],
          ["Estimated Jobs Created", `${wasteResults.economics.jobsCreated.toLocaleString()}`]
        ].forEach(([label, value]) => {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${label}</td><td>${value}</td>`;
          circularTbody.appendChild(row);
        });
    }

    // Update Carbon Capture Table
    const carbonTbody = document.querySelector("#carbon-capture-table tbody");
    if (carbonTbody) {
        carbonTbody.innerHTML = "";
        [
          ["Total CO₂ Captured/Utilized", `${inputs.carbon_capture_capacity.toFixed(2)} MT/year`],
          ["Effective CO₂ Reduction", `${carbonResults.totalReductionMT.toFixed(2)} MT/year`],
          ["Storage Allocation", `${carbonResults.storedMT.toFixed(2)} MT (${inputs.carbon_storage_percentage}%)`],
          ["Fuel Conversion Input", `${carbonResults.fuelConversionMT.toFixed(2)} MT (${inputs.carbon_fuel_percentage}%)`],
          ["Estimated Investment", `$${carbonResults.investment.toFixed(2)} B`],
          ["Estimated Jobs Created", `${carbonResults.jobs.toLocaleString()}`]
        ].forEach(([label, value]) => {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${label}</td><td>${value}</td>`;
          carbonTbody.appendChild(row);
        });
    }

    // Generate and update phased plan
    const phased = generatePhasedPlan(
      efficiencyResults, solarResults, nuclearResults, hydroResults,
      windResults, wasteResults, carbonResults,
      inputs.implementation_years, inputs.implementation_speed / 10, // Pass speed factor
      inputs.is_efficiency_first
    );
    updatePhasedPlanTable(phased);
    updatePhasedImplementationChart(phased);

    // Update Energy Mix Chart
    updateEnergyMixChart(solarResults, nuclearResults, hydroResults, windResults, wasteResults, carbonResults);

    // Update Jobs Distribution Chart
    updateJobsDistributionChart(efficiencyResults, solarResults, nuclearResults, hydroResults, windResults, wasteResults, carbonResults);

    // Update Efficiency UI (Table and Chart)
    updateEfficiencyUI(efficiencyResults);

    // Update Circular Economy UI (Table and Charts)
    updateCircularEconomyUI(wasteResults);

    // Update Carbon Capture UI (Table and Charts)
    updateCarbonCaptureUI(carbonResults);

  }

  // ========================
  // Helper: format numbers
  // ========================
  function formatNumber(num, decimals=2){
    if(num === undefined || num === null || isNaN(num)) return "N/A";
    if(num === Infinity) return "N/A";
    if(num === 0) return "0";
    // Use toLocaleString for formatting large numbers and respecting decimals
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }


  // ========================
  // Phased Plan Calculation
  // ========================
  function generatePhasedPlan(
    effResults, solarResults, nuclearResults, hydroResults,
    windResults, wasteResults, carbonCaptureResults,
    implementationYears, speedFactor, effFirst
  ){
    // Calculate number of phases based on implementation years
    const numPhases = Math.min(10, Math.max(5, Math.ceil(implementationYears / 2)));

    // Generate phase factors arrays using a non-linear curve (e.g., quadratic) for smoother ramp-up
    const phasePoints = Array(numPhases).fill(0).map((_, i) => (i + 1) / numPhases);
    const curveFactor = 1 / (speedFactor + 0.5); // Adjust curve based on speed

    const effPhaseFactors = phasePoints.map(p => Math.pow(p, curveFactor));
    const genPhaseFactors = phasePoints.map(p => Math.pow(p, curveFactor));

    // Adjust based on efficiency-first or generation-first approach (delay one track)
    const phases = effFirst
      ? effPhaseFactors.map((effF, i) => {
          const year = 2025 + Math.floor(i * (implementationYears / numPhases));
          // Delay generation start slightly
          const genF = i < 1 ? 0 : genPhaseFactors[i - 1];
          return {
            year, phase: i + 1,
            efficiencyFactor: effF,
            generationFactor: genF
          };
        })
      : genPhaseFactors.map((genF, i) => {
          const year = 2025 + Math.floor(i * (implementationYears / numPhases));
          // Delay efficiency start slightly
          const effF = i < 1 ? 0 : effPhaseFactors[i - 1];
          return {
            year, phase: i + 1,
            efficiencyFactor: effF,
            generationFactor: genF
          };
        });

    // Calculate totals for each phase
    return phases.map(p => {
      // Efficiency partial
      const effSaves = effResults.nationalSavingsTWh * p.efficiencyFactor;
      const effCO2 = effResults.nationalSavingsTWh * 0.417 * p.efficiencyFactor; // Use savings * grid intensity
      const effInv = effResults.investment * p.efficiencyFactor;
      const effJobs = effResults.jobs * p.efficiencyFactor;

      // Generation partial - solar
      const solarEnergy = solarResults.energyTWh * p.generationFactor;
      const solarCO2 = solarResults.carbonAvoided * p.generationFactor;
      const solarInv = solarResults.investment * p.generationFactor;
      const solarJobs = solarResults.jobs * p.generationFactor;

      // Generation partial - nuclear
      const nuclearEnergy = nuclearResults.energyTWh * p.generationFactor;
      const nuclearCO2 = nuclearResults.carbonAvoided * p.generationFactor;
      const nuclearInv = nuclearResults.investment * p.generationFactor;
      const nuclearJobs = nuclearResults.jobs * p.generationFactor;

      // Generation partial - hydro
      const hydroEnergy = hydroResults.energyTWh * p.generationFactor;
      const hydroCO2 = hydroResults.carbonAvoided * p.generationFactor;
      const hydroInv = hydroResults.investment * p.generationFactor;
      const hydroJobs = hydroResults.jobs * p.generationFactor;

      // Generation partial - wind
      const windEnergy = windResults.totalEnergyTWh * p.generationFactor;
      const windCO2 = windResults.carbonAvoided * p.generationFactor;
      const windInv = windResults.totalInvestment * p.generationFactor;
      const windJobs = windResults.totalJobs * p.generationFactor;

      // Generation partial - waste
      const wasteEnergy = wasteResults.energyGeneration.total * p.generationFactor;
      const wasteCO2 = wasteResults.carbonImpact.total * p.generationFactor; // Use total impact from waste calc
      const wasteInv = wasteResults.economics.totalInvestment * p.generationFactor;
      const wasteJobs = wasteResults.economics.jobsCreated * p.generationFactor;
      const landfillSaved = wasteResults.landfillSpaceSaved * p.generationFactor;

      // Generation partial - carbon capture
      const ccEnergy = carbonCaptureResults.energyFromFuels * p.generationFactor;
      const ccCO2 = carbonCaptureResults.totalReductionMT * p.generationFactor; // Use total reduction from CC calc
      const ccInv = carbonCaptureResults.investment * p.generationFactor;
      const ccJobs = carbonCaptureResults.jobs * p.generationFactor;

      // Totals
      const totalEnergyGen = solarEnergy + nuclearEnergy + hydroEnergy + windEnergy + wasteEnergy + ccEnergy;
      const netEnergy = totalEnergyGen - effSaves;
      const totalCarbon = effCO2 + solarCO2 + nuclearCO2 + hydroCO2 + windCO2 + wasteCO2 + ccCO2;
      const totalInvestment = effInv + solarInv + nuclearInv + hydroInv + windInv + wasteInv + ccInv;
      const totalJobs = effJobs + solarJobs + nuclearJobs + hydroJobs + windJobs + wasteJobs + ccJobs;

      return {
        year: p.year,
        phase: p.phase,
        efficiencyFactor: p.efficiencyFactor,
        generationFactor: p.generationFactor,
        totals: {
          investment: totalInvestment,
          carbonReduction: totalCarbon,
          jobs: totalJobs,
          netEnergyImpact: netEnergy,
          landfillSpaceSaved: landfillSaved,
          percentOfUSEmissions: (totalCarbon / 5222) * 100 // Assuming 5222 MT US baseline
        }
      };
    });
  }

  // ========================
  // UI Update Functions for Sections
  // ========================

  // Update Phased Plan Table
  function updatePhasedPlanTable(plan) {
    const tbody = document.getElementById("phased-plan-table")?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    plan.forEach(ph => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${ph.phase}</td>
        <td>${ph.year}</td>
        <td>${formatNumber(ph.totals.carbonReduction, 2)}</td>
        <td>${formatNumber(ph.totals.investment, 2)}</td>
        <td>${formatNumber(ph.totals.netEnergyImpact, 2)}</td>
        <td>${formatNumber(ph.totals.jobs / 1e6, 1)}M</td>
        <td>${formatNumber(ph.totals.landfillSpaceSaved, 0)}</td>
      `;
      tbody.appendChild(row);
    });
  }

  // Update Efficiency UI (Table and Chart)
  let efficiencyChart;
  function updateEfficiencyUI(effResults){
    // Fill the #efficiency-table with data
    const tBody = document.querySelector("#efficiency-table tbody");
    if (!tBody) return;
    tBody.innerHTML = "";

    const ph = effResults; // Already contains per-house and national
    const rows = [
      ["Passive Solar Savings (per house)", `${formatNumber(ph.passiveSolarSavingsPerHouse,0)} kWh`],
      ["GSHP Savings (per house)", `${formatNumber(ph.gshpSavingsPerHouse,0)} kWh`],
      ["HPWH Savings (per house)", `${formatNumber(ph.hpwhSavingsPerHouse,0)} kWh`],
      ["Total Savings (per house)", `${formatNumber(ph.perHouseSavings,0)} kWh (${formatNumber(ph.percentageReduction,1)}%)`],
      ["National Savings (Total)", `${formatNumber(ph.nationalSavingsTWh,2)} TWh`],
      ["Estimated Investment", `$${formatNumber(ph.investment,2)} B`],
      ["Estimated Payback", `${formatNumber(ph.payback,1)} years`],
      ["Estimated Jobs Created", `${formatNumber(ph.jobs,0)}`]
    ];

    rows.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${item[0]}</td><td>${item[1]}</td>`;
      tBody.appendChild(tr);
    });

    // Efficiency bar chart
    const barLabels = ["Passive Solar","GSHP","HPWH"];
    const barData = [
      ph.passiveSolarSavingsPerHouse,
      ph.gshpSavingsPerHouse, // Combined heating/cooling for simplicity
      ph.hpwhSavingsPerHouse
    ];

    const ctx = document.getElementById("efficiencySavingsChart")?.getContext("2d");
    if (!ctx) return;

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
            label: "Household kWh Savings per Measure",
            data: barData,
            backgroundColor: ["#f59e0b", "#16a34a", "#3b82f6"]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Savings per Household by Measure (kWh/year)'}
          },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  }

  // Update Circular Economy UI (Table and Charts)
  let materialFlowChart, resourceRecoveryChart;
  function updateCircularEconomyUI(wasteResults) {
    const tBody = document.querySelector("#circular-economy-table tbody");
    if (!tBody) return;
    tBody.innerHTML = "";

    const rows = [
      ["Total Waste Processed", `${formatNumber(wasteResults.wasteProcessedMT, 2)} M tons`],
      ["Energy from Waste", `${formatNumber(wasteResults.energyGeneration.total, 2)} TWh`],
      ["Landfill Space Saved", `${formatNumber(wasteResults.landfillSpaceSaved, 0)} cubic yards`],
      ["Estimated Investment", `$${formatNumber(wasteResults.economics.totalInvestment, 2)} B`],
      ["Net Annual Revenue/Value", `$${formatNumber(wasteResults.economics.netAnnualRevenue, 2)} B`],
      ["Estimated Jobs Created", `${formatNumber(wasteResults.economics.jobsCreated, 0)}`]
    ];

    rows.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${item[0]}</td><td>${item[1]}</td>`;
      tBody.appendChild(tr);
    });

    // Material Flow Chart
    const materialCtx = document.getElementById("materialFlowChart")?.getContext("2d");
    if (!materialCtx) return;
    const materialLabels = ["Food Waste", "Agricultural Waste", "Forest Residues", "Municipal Solid Waste"];
    // Approximate breakdown based on input utilization % and available tons
    const foodInput = 63 * (parseFloat(document.getElementById('food-waste-utilization').value)/100);
    const agInput = 800 * (parseFloat(document.getElementById('agriculture-utilization').value)/100);
    const forestInput = 93 * (parseFloat(document.getElementById('forest-utilization').value)/100);
    const mswInput = 292 * (parseFloat(document.getElementById('msw-utilization').value)/100);
    const materialData = [foodInput, agInput, forestInput, mswInput];

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
            legend: { position: 'bottom' },
            title: { display: true, text: 'Waste Material Input (Million Tons/year)' }
          }
        }
      });
    }

    // Resource Recovery Chart (Simplified: Energy vs. Material Value)
    const recoveryCtx = document.getElementById("resourceRecoveryChart")?.getContext("2d");
     if (!recoveryCtx) return;
    const recoveryLabels = ["Energy Value", "Material Value"];
    // Use calculated revenues as proxy for value distribution
    const recoveryData = [
        wasteResults.economics.electricityRevenue, // Energy value
        wasteResults.economics.materialRecoveryRevenue // Material value
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
            backgroundColor: ["#dc2626", "#2563eb"]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Resource Recovery Value ($B/year)' }
          }
        }
      });
    }
  }

  // Update Carbon Capture UI (Table and Charts)
  let carbonCaptureChart, carbonTimelineChart;
  function updateCarbonCaptureUI(carbonCaptureResults) {
    const tBody = document.querySelector("#carbon-capture-table tbody");
    if (!tBody) return;
    tBody.innerHTML = "";

    const rows = [
      ["Total CO₂ Captured/Utilized", `${formatNumber(carbonCaptureResults.capacityMT, 2)} MT/year`],
      ["Effective CO₂ Reduction", `${formatNumber(carbonCaptureResults.totalReductionMT, 2)} MT/year`],
      ["Storage Allocation", `${formatNumber(carbonCaptureResults.storedMT, 2)} MT (${formatNumber(carbonCaptureResults.storedMT / carbonCaptureResults.capacityMT * 100, 0)}%)`],
      ["Fuel Conversion Input", `${formatNumber(carbonCaptureResults.fuelConversionMT, 2)} MT (${formatNumber(carbonCaptureResults.fuelConversionMT / carbonCaptureResults.capacityMT * 100, 0)}%)`],
      ["Energy from Carbon Fuels", `${formatNumber(carbonCaptureResults.energyFromFuels, 2)} TWh`],
      ["Estimated Investment", `$${formatNumber(carbonCaptureResults.investment, 2)} B`],
      ["Estimated Jobs Created", `${formatNumber(carbonCaptureResults.jobs, 0)}`]
    ];

    rows.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${item[0]}</td><td>${item[1]}</td>`;
      tBody.appendChild(tr);
    });

    // Carbon Capture Allocation Chart
    const captureCtx = document.getElementById("carbonCaptureChart")?.getContext("2d");
    if (!captureCtx) return;
    const captureLabels = ["Underground Storage", "Carbon to Fuels"];
    const captureData = [
      carbonCaptureResults.storedMT,
      carbonCaptureResults.fuelConversionMT
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
            legend: { position: 'bottom' },
            title: { display: true, text: 'Carbon Capture Allocation (MT/year)' }
          }
        }
      });
    }

    // Carbon Timeline Chart - Cumulative reduction over implementation period
    const timelineCtx = document.getElementById("carbonTimelineChart")?.getContext("2d");
    if (!timelineCtx) return;
    const implementationYears = parseInt(document.getElementById('implementation-years').value);
    const years = Array.from({length: implementationYears}, (_, i) => 2025 + i);
    // Simple linear ramp-up for timeline chart
    const cumulativeReduction = years.map((_, i) => carbonCaptureResults.totalReductionMT * ((i + 1) / implementationYears));

    if(carbonTimelineChart) {
      carbonTimelineChart.data.labels = years;
      carbonTimelineChart.data.datasets[0].data = cumulativeReduction;
      carbonTimelineChart.update();
    } else {
      carbonTimelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: {
          labels: years,
          datasets: [{
            label: 'Cumulative CO₂ Reduction (MT)',
            data: cumulativeReduction,
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Projected Cumulative CO₂ Reduction' }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'CO₂ Reduction (MT)'} },
            x: { title: { display: true, text: 'Year'} }
          }
        }
      });
    }
  }

  // ========================
  // Chart Initialization and Update Functions
  // ========================
  let energyMixChart, jobsDistributionChart, phasedImplementationChart; // Keep chart instances

  // Update Energy Mix Chart
  function updateEnergyMixChart(solarResults, nuclearResults, hydroResults, windResults, wasteResults, carbonCaptureResults){
    const ctx = document.getElementById('energyMixChart')?.getContext('2d');
    if (!ctx) return;
    const labels = ["Solar", "Nuclear", "Hydro", "Wind", "Waste-to-Energy", "Carbon-to-Fuels"];
    const data = [
      solarResults.energyTWh, nuclearResults.energyTWh, hydroResults.energyTWh,
      windResults.totalEnergyTWh, wasteResults.energyGeneration.total, carbonCaptureResults.energyFromFuels
    ].map(v => Math.max(0, v)); // Ensure non-negative values

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
            backgroundColor: ["#facc15", "#a78bfa", "#3b82f6", "#84cc16", "#f87171", "#c084fc"]
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
            title: { display: true, text: 'Energy Generation by Source (TWh)' }
          }
        }
      });
    }
  }

  // Update Jobs Distribution Chart
  function updateJobsDistributionChart(effResults, solarResults, nuclearResults, hydroResults, windResults, wasteResults, carbonCaptureResults){
    const ctx = document.getElementById('jobsDistributionChart')?.getContext('2d');
     if (!ctx) return;
    const labels = ["Efficiency", "Solar", "Nuclear", "Hydro", "Wind", "Waste", "Carbon Capture"];
    const data = [
      effResults.jobs, solarResults.jobs, nuclearResults.jobs, hydroResults.jobs,
      windResults.totalJobs, wasteResults.economics.jobsCreated, carbonCaptureResults.jobs
    ].map(v => Math.max(0, v));

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
            backgroundColor: ["#2563eb", "#facc15", "#a78bfa", "#3b82f6", "#84cc16", "#f87171", "#c084fc"]
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Jobs Created by Sector' }
          },
          scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of Jobs'} } }
        }
      });
    }
  }

  // Update Phased Implementation Chart
  function updatePhasedImplementationChart(phased){
    const ctx = document.getElementById('phasedImplementationChart')?.getContext('2d');
    if (!ctx) return;
    const years = phased.map(p => p.year);
    const carbonReduction = phased.map(p => p.totals?.carbonReduction || 0);
    const jobs = phased.map(p => (p.totals?.jobs || 0) / 1e6); // In millions

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
              label: 'Carbon Reduction (MT)', data: carbonReduction,
              borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)',
              yAxisID: 'y', fill: true, tension: 0.1
            },
            {
              label: 'Jobs Created (Millions)', data: jobs,
              borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)',
              yAxisID: 'y1', fill: true, tension: 0.1
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { title: { display: true, text: 'Phased Implementation Timeline' } },
          scales: {
            y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Carbon Reduction (MT)'}, beginAtZero: true },
            y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Jobs (Millions)'}, grid: { drawOnChartArea: false }, beginAtZero: true }
          }
        }
      });
    }
  }

  // ========================
  // 6. EVENT LISTENERS FOR BUTTONS
  // ========================
  const applyButton = document.getElementById("apply-parameters-button");
  if (applyButton) {
      applyButton.addEventListener("click", updateCalculations);
  }

  const resetButton = document.getElementById("reset-button");
  if (resetButton) {
      // Resetting to defaults might be better than reload
      resetButton.addEventListener("click", () => {
          parameterSliders.forEach(id => {
              const slider = document.getElementById(id);
              if (slider) {
                  slider.value = slider.defaultValue; // Reset to default HTML value
                  const displaySpan = document.getElementById(`${id}-value`);
                  if (displaySpan) {
                      displaySpan.textContent = formatDisplayValue(id, slider.value);
                  }
              }
          });
          // Reset toggle buttons to default (assuming first is default)
          document.getElementById('retrofit-button')?.classList.add('active');
          document.getElementById('new-construction-button')?.classList.remove('active');
          document.getElementById('efficiency-first-button')?.classList.add('active');
          document.getElementById('generation-first-button')?.classList.remove('active');

          updateCalculations(); // Recalculate with defaults
      });
  }

  // Add Export and Share button listeners if needed
  // document.getElementById("export-button").addEventListener("click", exportResults);
  // document.getElementById("share-button").addEventListener("click", shareResults);


  // ========================
  // 7. INITIAL CALCULATION ON LOAD
  // ========================
  updateCalculations();

  // 9. SHARE FUNCTIONALITY
  // ========================
  function setupShareButton() {
    const shareButton = document.getElementById("share-button");
    if (shareButton) {
      shareButton.addEventListener("click", function() {
        // Create a summary of results from dashboard elements
        const summary = {
          energyEfficiency: document.getElementById("energy-efficiency-impact")?.textContent || 'N/A',
          netEnergyImpact: document.getElementById("net-energy-impact")?.textContent || 'N/A',
          carbonReduction: document.getElementById("carbon-reduction")?.textContent || 'N/A',
          landfillSaved: document.getElementById("landfill-space-saved")?.textContent || 'N/A',
          jobsCreated: document.getElementById("jobs-created")?.textContent || 'N/A',
          investment: document.getElementById("total-investment")?.textContent || 'N/A'
        };

        const shareText = `Circular Economy Calculator Results:\n` +
                          `- Energy Efficiency: ${summary.energyEfficiency}\n` +
                          `- Net Energy Impact: ${summary.netEnergyImpact}\n` +
                          `- Carbon Reduction: ${summary.carbonReduction}\n` +
                          `- Landfill Saved: ${summary.landfillSaved}\n` +
                          `- Jobs Created: ${summary.jobsCreated}\n` +
                          `- Total Investment: ${summary.investment}`;

        if (navigator.share) {
          navigator.share({
            title: 'Circular Economy Calculator Results',
            text: shareText,
          }).catch(error => {
            console.error('Error sharing:', error);
            fallbackShare(shareText); // Use fallback if share fails
          });
        } else {
          fallbackShare(shareText); // Use fallback if share API not supported
        }
      });
    }
  }

  function fallbackShare(textToCopy) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert('Results copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy results:', err);
      alert('Could not copy results. Please copy manually.');
    });
  }
  setupShareButton(); // Initialize share button listener

  // ========================
  // 10. EXPORT FUNCTIONALITY
  // ========================
  function setupExportButton() {
      const exportButton = document.getElementById("export-button");
      if (exportButton) {
          exportButton.addEventListener("click", function() {
              // Gather key results (can be expanded)
              const dataToExport = {
                  dashboardSummary: {
                      energyEfficiencyImpact: document.getElementById("energy-efficiency-impact")?.textContent,
                      netEnergyImpact: document.getElementById("net-energy-impact")?.textContent,
                      carbonReduction: document.getElementById("carbon-reduction")?.textContent,
                      landfillSpaceSaved: document.getElementById("landfill-space-saved")?.textContent,
                      totalInvestment: document.getElementById("total-investment")?.textContent,
                      paybackPeriod: document.getElementById("payback-period")?.textContent,
                      jobsCreated: document.getElementById("jobs-created")?.textContent,
                  },
                  // Could add detailed results from calculation functions if needed
              };
              const json = JSON.stringify(dataToExport, null, 2);
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "waste-to-energy-results.json";
              document.body.appendChild(link); // Required for Firefox
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
          });
      }
  }
  setupExportButton(); // Initialize export button listener


}); // End DOMContentLoaded
