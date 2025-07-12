// Generic card component to eliminate duplication
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}

interface GenericCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  actions?: ActionButton[];
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'error' | 'info';
  };
}

export const GenericCard: React.FC<GenericCardProps> = ({
  title,
  subtitle,
  icon,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available',
  emptyIcon = '📝',
  actions = [],
  children,
  className = '',
  onClick,
  badge,
}) => {
  const cardClassName = `${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`;

  if (isLoading) {
    return (
      <Card className={cardClassName}>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card className={cardClassName}>
        <CardContent className="text-center py-8">
          <div className="text-4xl mb-4">{emptyIcon}</div>
          <p className="text-muted-foreground">{emptyMessage}</p>
          {actions.length > 0 && (
            <div className="flex gap-2 justify-center mt-4">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'primary'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  size="sm"
                >
                  {action.loading ? <LoadingSpinner size="sm" /> : action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClassName} onClick={onClick}>
      {(title || subtitle || icon || badge) && (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {icon && <div className="text-lg">{icon}</div>}
              <div>
                {title && (
                  <CardTitle className="text-base flex items-center gap-2">
                    {title}
                    {badge && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getBadgeColors(badge.variant)}`}>
                        {badge.text}
                      </span>
                    )}
                  </CardTitle>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={title || subtitle ? 'pt-0' : ''}>
        {children}
        
        {actions.length > 0 && (
          <div className="flex gap-2 mt-4">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                onClick={action.onClick}
                disabled={action.disabled}
                size="sm"
              >
                {action.loading ? <LoadingSpinner size="sm" /> : action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const getBadgeColors = (variant: 'success' | 'warning' | 'error' | 'info'): string => {
  switch (variant) {
    case 'success':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'error':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'info':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};