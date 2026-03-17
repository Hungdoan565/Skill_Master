import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Reusable page header for Teacher Portal
 * Provides consistent layout for title, subtitle, icon, breadcrumbs, and right-side actions.
 * 
 * @param {Object} props
 * @param {string} props.title - The main page title
 * @param {string} props.subtitle - Optional subtitle below title
 * @param {React.ElementType} props.icon - Lucide icon component for the title
 * @param {string} props.iconColorClass - Tailwind color class for the icon (e.g. 'text-blue-500')
 * @param {boolean} props.showBreadcrumb - Whether to show the "Home > [Page]" breadcrumb
 * @param {React.ReactNode} props.actions - Elements to show on the right side (buttons, filters)
 * @param {string} props.className - Additional classes for the outer container
 */
export function TeacherPageHeader({
    title,
    subtitle,
    icon: Icon,
    iconColorClass = 'text-blue-500',
    showBreadcrumb = true,
    actions,
    className
}) {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6", className)}>
            <div className="space-y-1">
                {/* Breadcrumb */}
                {showBreadcrumb && (
                    <nav className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-3">
                        <Link 
                            to="/teacher" 
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                        >
                            <Home className="h-3.5 w-3.5" />
                            <span>Tổng quan</span>
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="text-foreground">{title}</span>
                    </nav>
                )}

                {/* Title Section */}
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2.5 tracking-tight">
                    {Icon && (
                        <span className={cn("p-2 rounded-xl bg-muted/50", iconColorClass)}>
                            <Icon className="h-6 w-6" />
                        </span>
                    )}
                    {title}
                </h1>
                
                {subtitle && (
                    <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mt-1.5">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Actions (Right Side) */}
            {actions && (
                <div className="flex items-center gap-2 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
