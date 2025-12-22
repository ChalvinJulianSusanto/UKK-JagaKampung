import { motion } from 'framer-motion';

const Skeleton = ({ className = '', variant = 'default' }) => {
  const baseClasses = 'bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded';

  const variants = {
    default: 'h-4',
    text: 'h-4 w-full',
    title: 'h-8 w-3/4',
    card: 'h-32 w-full',
    circle: 'rounded-full w-12 h-12',
    avatar: 'rounded-full w-10 h-10',
    button: 'h-10 w-24',
  };

  return (
    <motion.div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        backgroundSize: '200% 100%',
      }}
    />
  );
};

// Skeleton untuk Card
export const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
    <Skeleton variant="title" />
    <Skeleton variant="text" className="w-full" />
    <Skeleton variant="text" className="w-5/6" />
    <Skeleton variant="text" className="w-4/6" />
  </div>
);

// Skeleton untuk Table Row
export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr className="border-b border-neutral-200">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <Skeleton variant="text" />
      </td>
    ))}
  </tr>
);

// Skeleton untuk Table
export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <table className="min-w-full divide-y divide-neutral-200">
      <thead className="bg-neutral-50">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-6 py-3">
              <Skeleton variant="text" className="w-24" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-neutral-200">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

// Skeleton untuk Dashboard
export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton variant="title" className="w-1/3" />
      <Skeleton variant="text" className="w-1/4" />
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-6 space-y-3">
          <Skeleton variant="text" className="w-1/2" />
          <Skeleton variant="title" className="w-3/4" />
          <Skeleton variant="text" className="w-2/3" />
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

// Skeleton untuk Page dengan Table
export const PageWithTableSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton variant="title" className="w-1/4" />
      <Skeleton variant="button" />
    </div>

    {/* Filters/Search */}
    <div className="flex gap-4">
      <Skeleton variant="default" className="w-64 h-10" />
      <Skeleton variant="button" />
    </div>

    {/* Table */}
    <TableSkeleton rows={8} columns={6} />

    {/* Pagination */}
    <div className="flex justify-between items-center">
      <Skeleton variant="text" className="w-32" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="default" className="w-10 h-10" />
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
