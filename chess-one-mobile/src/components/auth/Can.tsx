import React, { ReactNode } from 'react';
import type { Permission } from '../../constants/permissions';
import { useCan, useIsOwner } from '../../hooks/useCan';

export interface CanProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const allowed = useCan(permission);
  if (!allowed) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
}

export interface CanOwnProps {
  ownerId: number | null | undefined;
  children: ReactNode;
  fallback?: ReactNode;
}

export function CanOwn({ ownerId, children, fallback = null }: CanOwnProps) {
  const isOwner = useIsOwner(ownerId);
  if (!isOwner) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
}

export default Can;
