/**
 * HorizontalBarChart Component
 * Biểu đồ thanh ngang đơn giản
 * - Không dùng thư viện chart ngoài
 * - Animation khi render
 * - Responsive
 */

import { useMemo } from 'react';

// Color presets
const COLORS = {
    blue: { bg: 'bg-blue-100', fill: 'bg-blue-500' },
    green: { bg: 'bg-emerald-100', fill: 'bg-emerald-500' },
    orange: { bg: 'bg-orange-100', fill: 'bg-orange-500' },
    purple: { bg: 'bg-purple-100', fill: 'bg-purple-500' },
    red: { bg: 'bg-red-100', fill: 'bg-red-500' },
    cyan: { bg: 'bg-cyan-100', fill: 'bg-cyan-500' },
    pink: { bg: 'bg-pink-100', fill: 'bg-pink-500' },
    yellow: { bg: 'bg-yellow-100', fill: 'bg-yellow-500' },
    indigo: { bg: 'bg-indigo-100', fill: 'bg-indigo-500' },
    gray: { bg: 'bg-gray-100', fill: 'bg-gray-500' },
};

const DEFAULT_COLORS = ['blue', 'green', 'orange', 'purple', 'red', 'cyan', 'pink', 'yellow'];

/**
 * Format number for display
 */
function formatValue(value, format = 'number') {
    if (value === null || value === undefined) return '0';

    switch (format) {
        case 'currency':
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0
            }).format(value);

        case 'percent':
            return `${Math.round(value)}%`;

        case 'compact':
            return new Intl.NumberFormat('vi-VN', {
                notation: 'compact',
                compactDisplay: 'short'
            }).format(value);

        default:
            return new Intl.NumberFormat('vi-VN').format(value);
    }
}

/**
 * Single bar item
 */
function BarItem({
    item,
    maxValue,
    color,
    showValue,
    valueFormat,
    index,
    barHeight
}) {
    const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
    const colorConfig = COLORS[color] || COLORS.blue;

    return (
        <div className="space-y-1.5">
            {/* Label row */}
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 truncate flex-1 pr-2">
                    {item.label}
                </span>
                {showValue && (
                    <span className="text-gray-500 flex-shrink-0">
                        {formatValue(item.value, valueFormat)}
                    </span>
                )}
            </div>

            {/* Bar */}
            <div className={`${colorConfig.bg} rounded-full overflow-hidden`} style={{ height: barHeight }}>
                <div
                    className={`
            ${colorConfig.fill} h-full rounded-full
            transition-all duration-700 ease-out
          `}
                    style={{
                        width: `${percentage}%`,
                        transitionDelay: `${index * 100}ms`
                    }}
                />
            </div>
        </div>
    );
}

/**
 * Loading skeleton
 */
function BarSkeleton({ count = 5, barHeight = 8 }) {
    return (
        <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                    <div className="flex justify-between">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-4 w-12 bg-gray-200 rounded" />
                    </div>
                    <div className="bg-gray-200 rounded-full" style={{ height: barHeight }}>
                        <div
                            className="h-full bg-gray-300 rounded-full"
                            style={{ width: `${60 - i * 10}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Empty state
 */
function EmptyState({ message = 'Không có dữ liệu' }) {
    return (
        <div className="py-8 text-center">
            <div className="h-24 w-24 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="space-y-1">
                    {[80, 60, 40].map((w, i) => (
                        <div
                            key={i}
                            className="h-2 bg-gray-300 rounded"
                            style={{ width: w }}
                        />
                    ))}
                </div>
            </div>
            <p className="text-sm text-gray-500">{message}</p>
        </div>
    );
}

/**
 * HorizontalBarChart
 * @param {Object} props
 * @param {Array} props.data - Array of { label: string, value: number, color?: string }
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.showValue - Show value next to bar (default: true)
 * @param {string} props.valueFormat - 'number' | 'currency' | 'percent' | 'compact'
 * @param {number} props.barHeight - Height of bars in pixels (default: 8)
 * @param {number} props.maxValue - Custom max value (default: auto from data)
 * @param {boolean} props.sortByValue - Sort bars by value descending (default: true)
 * @param {number} props.maxItems - Maximum items to show
 * @param {string} props.emptyMessage - Message when no data
 */
export function HorizontalBarChart({
    data = [],
    loading = false,
    showValue = true,
    valueFormat = 'number',
    barHeight = 8,
    maxValue: customMaxValue,
    sortByValue = true,
    maxItems,
    emptyMessage = 'Không có dữ liệu'
}) {
    // Process data
    const processedData = useMemo(() => {
        let items = [...data];

        // Sort by value if needed
        if (sortByValue) {
            items.sort((a, b) => b.value - a.value);
        }

        // Limit items
        if (maxItems && items.length > maxItems) {
            items = items.slice(0, maxItems);
        }

        return items;
    }, [data, sortByValue, maxItems]);

    // Calculate max value
    const maxValue = useMemo(() => {
        if (customMaxValue !== undefined) return customMaxValue;
        if (processedData.length === 0) return 100;
        return Math.max(...processedData.map(d => d.value));
    }, [customMaxValue, processedData]);

    // Loading state
    if (loading) {
        return <BarSkeleton count={maxItems || 5} barHeight={barHeight} />;
    }

    // Empty state
    if (processedData.length === 0) {
        return <EmptyState message={emptyMessage} />;
    }

    return (
        <div className="space-y-4">
            {processedData.map((item, index) => (
                <BarItem
                    key={item.label || index}
                    item={item}
                    maxValue={maxValue}
                    color={item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                    showValue={showValue}
                    valueFormat={valueFormat}
                    index={index}
                    barHeight={barHeight}
                />
            ))}
        </div>
    );
}

export default HorizontalBarChart;
