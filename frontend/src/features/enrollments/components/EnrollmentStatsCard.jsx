/**
 * EnrollmentStatsCard - Stats card for enrollments page
 * Extracted from EnrollmentsPage
 */

export function EnrollmentStatsCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white dark:bg-gray-800/60 rounded-lg border dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
            </div>
        </div>
    );
}

export default EnrollmentStatsCard;
