import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js';

const ResourceRecoveryChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');

            // Destroy the existing chart instance if it exists
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            // Ensure data is valid before creating the chart
            if (data && data.length > 0) {
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'bar', // Change to your desired chart type
                    data: {
                        labels: data.map(item => item.label),
                        datasets: [
                            {
                                label: 'Resource Recovery',
                                data: data.map(item => item.value),
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true },
                            title: { display: true, text: 'Resource Recovery Chart' },
                        },
                        scales: {
                            y: { beginAtZero: true },
                        },
                    },
                });
            }
        }
    }, [data]);

    return <canvas ref={chartRef} id="resourceRecoveryChart" />;
};

export default ResourceRecoveryChart;
