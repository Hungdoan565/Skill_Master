/**
 * CircularProgress Component
 * Biểu đồ tròn hiển thị progress
 * - SVG-based, không cần thư viện ngoài
 * - Animated
 * - Customizable colors và sizes
 */

import { useMemo } from 'react';

/**
 * Calculate SVG arc path
 */
function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
    };
}

// Color presets
const COLORS = {
    blue: { stroke: '#3B82F6', background: '#DBEAFE' },
    green: { stroke: '#10B981', background: '#D1FAE5' },
    orange: { stroke: '#F97316', background: '#FED7AA' },
    purple: { stroke: '#8B5CF6', background: '#EDE9FE' },
    red: { stroke: '#EF4444', background: '#FEE2E2' },
    cyan: { stroke: '#06B6D4', background: '#CFFAFE' },
    pink: { stroke: '#EC4899', background: '#FCE7F3' },
    indigo: { stroke: '#6366F1', background: '#E0E7FF' },
    gray: { stroke: '#6B7280', background: '#F3F4F6' },
};

/**
 * Loading skeleton
 */
function CircularProgressSkeleton({ size = 120 }) {
    return (
        <div className="flex items-center justify-center animate-pulse">
            <div
                className="rounded-full bg-gray-200"
                style={{ width: size, height: size }}
            />
        </div>
    );
}

/**
 * CircularProgress
 * @param {Object} props
 * @param {number} props.value - Progress value (0-100)
 * @param {number} props.size - Circle size in pixels (default: 120)
 * @param {number} props.strokeWidth - Stroke width (default: 10)
 * @param {string} props.color - Color preset name
 * @param {string} props.strokeColor - Custom stroke color
 * @param {string} props.backgroundColor - Custom background color
 * @param {string} props.label - Center label (overrides value display)
 * @param {boolean} props.showValue - Show percentage value in center (default: true)
 * @param {string} props.valueFormat - Format: 'percent' | 'number' | 'none'
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.animated - Enable animation (default: true)
 * @param {React.ReactNode} props.children - Custom center content
 */
export function CircularProgress({
    value = 0,
    size = 120,
    strokeWidth = 10,
    color = 'blue',
    strokeColor,
    backgroundColor,
    label,
    showValue = true,
    valueFormat = 'percent',
    loading = false,
    animated = true,
    children
}) {
    // Get colors
    const colors = useMemo(() => {
        const preset = COLORS[color] || COLORS.blue;
        return {
            stroke: strokeColor || preset.stroke,
            background: backgroundColor || preset.background
        };
    }, [color, strokeColor, backgroundColor]);

    // Clamp value between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, value));

    // Calculate dimensions
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

    // Format display value
    const displayValue = useMemo(() => {
        if (label) return label;
        if (!showValue) return null;

        switch (valueFormat) {
            case 'percent':
                return `${Math.round(clampedValue)}%`;
            case 'number':
                return Math.round(clampedValue);
            case 'none':
                return null;
            default:
                return `${Math.round(clampedValue)}%`;
        }
    }, [label, showValue, valueFormat, clampedValue]);

    if (loading) {
        return <CircularProgressSkeleton size={size} />;
    }

    return (
        <div
            className="relative inline-flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            {/* SVG Circle */}
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={colors.background}
                    strokeWidth={strokeWidth}
                />

                {/* Progress circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={animated ? 'transition-all duration-1000 ease-out' : ''}
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
                {children || (
                    displayValue !== null && (
                        <span
                            className="font-bold text-gray-900"
                            style={{ fontSize: size * 0.18 }}
                        >
                            {displayValue}
                        </span>
                    )
                )}
            </div>
        </div>
    );
}

/**
 * CircularProgressWithLabel
 * Circular progress with label below
 */
export function CircularProgressWithLabel({
    value,
    label,
    sublabel,
    color = 'blue',
    size = 100,
    ...props
}) {
    return (
        <div className="flex flex-col items-center gap-2">
            <CircularProgress
                value={value}
                color={color}
                size={size}
                {...props}
            />
            {label && (
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    {sublabel && (
                        <p className="text-xs text-gray-500">{sublabel}</p>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * MultiCircularProgress
 * Multiple circular progress indicators in a row
 */
export function MultiCircularProgress({
    items = [],
    size = 80,
    loading = false
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-around gap-4">
                {[...Array(3)].map((_, i) => (
                    <CircularProgressSkeleton key={i} size={size} />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="py-4 text-center text-sm text-gray-500">
                Không có dữ liệu
            </div>
        );
    }

    return (
        <div className="flex items-center justify-around gap-4 flex-wrap">
            {items.map((item, index) => (
                <CircularProgressWithLabel
                    key={item.id || index}
                    value={item.value}
                    label={item.label}
                    sublabel={item.sublabel}
                    color={item.color || Object.keys(COLORS)[index % Object.keys(COLORS).length]}
                    size={size}
                />
            ))}
        </div>
    );
}

export default CircularProgress;
