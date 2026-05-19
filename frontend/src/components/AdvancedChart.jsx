import React, { useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType, AreaSeries, LineSeries } from 'lightweight-charts';

/**
 * AdvancedChart Component
 * Uses lightweight-charts for high-performance financial visualization.
 * Supports Zoom, Pan, and Compare modes.
 */
export default function AdvancedChart({ chartData, range, mainSymbol, compareData, compareSymbol }) {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const areaSeriesRef = useRef(null);
  const compareSeriesRef = useRef(null);
 
   const handleResize = useCallback(() => {
    if (chartRef.current && chartContainerRef.current) {
      // Use the parent's width as a safer boundary
      const parentWidth = chartContainerRef.current.parentElement?.clientWidth || chartContainerRef.current.clientWidth;
      const height = chartContainerRef.current.clientHeight || 450;
      
      if (parentWidth > 0) {
        chartRef.current.applyOptions({ 
          width: parentWidth - 2, // Small buffer to prevent scrollbars
          height: height 
        });
        requestAnimationFrame(() => {
          chartRef.current?.timeScale().fitContent();
        });
      }
    }
  }, []);

  // 1. Initialize Chart (Only once)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 500,
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: true,
        secondsVisible: range === 'LIVE',
      },
      leftPriceScale: {
        visible: !!compareData,
        borderColor: '#e2e8f0',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      rightPriceScale: {
        visible: true,
        borderColor: '#e2e8f0',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#6366f1', width: 1, style: 3, labelBackgroundColor: '#6366f1' },
        horzLine: { color: '#6366f1', width: 1, style: 3, labelBackgroundColor: '#6366f1' },
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#6366f1',
      topColor: 'rgba(99, 102, 241, 0.15)',
      bottomColor: 'rgba(99, 102, 241, 0.0)',
      lineWidth: 3,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      priceScaleId: 'right',
    });

    chartRef.current = chart;
    areaSeriesRef.current = areaSeries;


    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        areaSeriesRef.current = null;
        compareSeriesRef.current = null;
      }
    };
  }, []);

  // 2. Update Range Options
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        timeScale: { secondsVisible: range === 'LIVE' },
      });
    }
  }, [range]);

  useEffect(() => {
    const timer = setTimeout(handleResize, 200);
    return () => clearTimeout(timer);
  }, []);

  // 4. DATA SYNC - MAIN SERIES
  useEffect(() => {
    if (!areaSeriesRef.current || !chartData) return;

    const formattedData = chartData
      .map(item => ({
        time: item.time,
        value: item.price || item.close,
      }))
      .filter(item => typeof item.value === 'number' && !isNaN(item.value))
      .sort((a, b) => a.time - b.time);

    const uniqueData = [];
    const seenTimes = new Set();
    for (const item of formattedData) {
      if (!seenTimes.has(item.time)) {
        uniqueData.push(item);
        seenTimes.add(item.time);
      }
    }

    if (uniqueData.length > 0) {
      areaSeriesRef.current.setData(uniqueData);
      requestAnimationFrame(() => {
        handleResize();
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      });
    }
  }, [chartData]);

  // 4. Handle Comparison
  useEffect(() => {
    if (!chartRef.current) return;

    if (!compareData) {
      if (compareSeriesRef.current) {
        chartRef.current.removeSeries(compareSeriesRef.current);
        compareSeriesRef.current = null;
        chartRef.current.applyOptions({
          leftPriceScale: { visible: false }
        });
      }
      return;
    }

    if (compareSeriesRef.current) {
      chartRef.current.removeSeries(compareSeriesRef.current);
    }

    chartRef.current.applyOptions({
      leftPriceScale: { visible: true }
    });

    const compareSeries = chartRef.current.addSeries(LineSeries, {
      color: '#f43f5e',
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      title: compareSymbol?.toUpperCase(),
      priceScaleId: 'left',
    });

    const formattedCompare = compareData
      .map(item => ({
        time: item.time,
        value: item.price || item.close,
      }))
      .filter(item => typeof item.value === 'number' && !isNaN(item.value))
      .sort((a, b) => a.time - b.time);

    const uniqueCompare = [];
    const seenTimes = new Set();
    for (const item of formattedCompare) {
      if (!seenTimes.has(item.time)) {
        uniqueCompare.push(item);
        seenTimes.add(item.time);
      }
    }

    compareSeries.setData(uniqueCompare);
    compareSeriesRef.current = compareSeries;

  }, [compareData, compareSymbol]);

  return (
    <div className="relative w-full h-full flex flex-col min-w-0 overflow-hidden bg-white">
      <div ref={chartContainerRef} className="flex-1 w-full h-full min-w-0" />
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-50/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">{mainSymbol}</span>
        </div>
      </div>
    </div>
  );
}
