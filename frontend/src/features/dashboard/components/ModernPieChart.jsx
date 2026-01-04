import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-100 p-3 rounded-xl shadow-xl ring-1 ring-black/5">
                <p className="text-sm font-bold text-gray-900">{payload[0].name}</p>
                <p className="text-xs text-primary font-medium mt-0.5">
                    {payload[0].value} học viên
                </p>
            </div>
        );
    }
    return null;
};

const CustomLegend = ({ payload }) => {
    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
            {payload.map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center gap-2 group cursor-default">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs text-gray-500 font-medium truncate group-hover:text-gray-900 transition-colors">
                        {entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

export function ModernPieChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[240px] text-gray-400">
                <p className="text-sm font-medium">Chưa có dữ liệu</p>
            </div>
        );
    }

    const chartData = data
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 6);

    return (
        <div style={{ width: '100%', height: 320 }} className="-mt-10">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} verticalAlign="bottom" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export default ModernPieChart;
