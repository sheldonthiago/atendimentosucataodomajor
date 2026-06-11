import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: "green" | "blue" | "yellow" | "red";
  trend?: number;
}

const colors = {
  green: "bg-green-50 text-green-600 border-green-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
  red: "bg-red-50 text-red-600 border-red-100",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
      <div className={`p-3 rounded-lg border ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <p
            className={`text-xs font-medium mt-1 ${
              trend >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {trend >= 0 ? "+" : ""}
            {trend}% em relação ao mês anterior
          </p>
        )}
      </div>
    </div>
  );
}
