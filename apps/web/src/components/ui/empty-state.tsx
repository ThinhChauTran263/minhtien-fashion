export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-primary-300">{icon}</div>}
      <h3 className="mb-2 text-heading-md text-primary-900">{title}</h3>
      {description && <p className="mb-6 max-w-md text-body-sm text-primary-600">{description}</p>}
      {action}
    </div>
  );
}

