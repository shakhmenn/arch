import { ReactNode } from 'react';
import { compose } from '@shared/lib/compose';
import { withRouter } from './with-router';
import { withTheme } from './with-theme';

export interface ProvidersProps {
  children: ReactNode;
}

export const withProviders = compose(
  withRouter,
  withTheme
);
