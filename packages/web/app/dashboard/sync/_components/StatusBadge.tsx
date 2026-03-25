import { cn } from "../../../../lib/utils";
import { 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Upload 
} from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const getStatusDetails = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          icon: <Clock className="h-3 w-3 mr-1" />,
          classes: "bg-amber-50 text-amber-700 border-amber-200"
        };
      case 'processing':
        return {
          label: 'Processing',
          icon: <RefreshCw className="h-3 w-3 mr-1 animate-spin" />,
          classes: "bg-blue-50 text-blue-700 border-blue-200"
        };
      case 'completed':
        return {
          label: 'Completed',
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
          classes: "bg-emerald-50 text-emerald-700 border-emerald-200"
        };
      case 'error':
        return {
          label: 'Error',
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          classes: "bg-red-50 text-red-700 border-red-200"
        };
      case 'uploaded':
        return {
          label: 'Uploaded',
          icon: <Upload className="h-3 w-3 mr-1" />,
          classes: "bg-purple-50 text-purple-700 border-purple-200"
        };
      default:
        return {
          label: status,
          icon: null,
          classes: "bg-gray-100 text-gray-700 border-gray-200"
        };
    }
  };

  const { label, icon, classes } = getStatusDetails();

  return (
    <span className={cn(
      "px-2 py-1 rounded-full text-xs font-medium border inline-flex items-center whitespace-nowrap", 
      classes
    )}>
      {icon}
      {label}
    </span>
  );
}
