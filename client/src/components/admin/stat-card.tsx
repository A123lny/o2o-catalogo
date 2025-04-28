import { 
  Car,
  Mail,
  Users,
  FileSignature,
  TrendingUp,
  TrendingDown,
  LucideIcon
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  trend: "up" | "down" | "none";
  trendValue?: string;
  trendText?: string;
  color: "blue" | "indigo" | "green" | "yellow" | "red";
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  trendText,
  color 
}: StatCardProps) {
  const getIconComponent = () => {
    switch (icon) {
      case "car":
        return <Car className="text-xl" />;
      case "envelope":
        return <Mail className="text-xl" />;
      case "users":
        return <Users className="text-xl" />;
      case "file-signature":
        return <FileSignature className="text-xl" />;
      default:
        return <Car className="text-xl" />;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-100",
          text: "text-blue-600"
        };
      case "indigo":
        return {
          bg: "bg-indigo-100",
          text: "text-indigo-600"
        };
      case "green":
        return {
          bg: "bg-green-100",
          text: "text-green-600"
        };
      case "yellow":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-600"
        };
      case "red":
        return {
          bg: "bg-red-100",
          text: "text-red-600"
        };
      default:
        return {
          bg: "bg-blue-100",
          text: "text-blue-600"
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neutral-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className={`${colorClasses.bg} p-3 rounded-full ${colorClasses.text}`}>
          {getIconComponent()}
        </div>
      </div>
      {trend !== "none" && (
        <div className="flex items-center mt-4 text-xs">
          <span className={`flex items-center ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {trendValue}
          </span>
          {trendText && <span className="text-neutral-500 ml-2">{trendText}</span>}
        </div>
      )}
    </div>
  );
}
