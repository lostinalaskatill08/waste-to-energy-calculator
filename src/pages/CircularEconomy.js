import React, { useState, useEffect } from 'react';
import ResourceRecoveryChart from '../components/ResourceRecoveryChart';

const CircularEconomy = () => {
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/resource-recovery-data'); // Replace with your API endpoint
                const data = await response.json();

                // Transform data into the format expected by the chart
                const formattedData = data.map(item => ({
                    label: item.category, // Replace with the correct property name
                    value: item.amount,  // Replace with the correct property name
                }));

                setChartData(formattedData);
            } catch (error) {
                console.error('Error fetching chart data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <h1>Circular Economy</h1>
            <div style={{ height: '400px', width: '100%' }}>
                <ResourceRecoveryChart data={chartData} />
            </div>
        </div>
    );
};

export default CircularEconomy;
