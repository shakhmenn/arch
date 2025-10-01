import { PageWrapper } from "@shared/ui/page-wrapper.tsx";
import { Suspense, type ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import { routeConfig } from '../config/route-config.tsx';
import { RequireAuth } from './require-auth';

export const AppRouter = () => {
  return (
      <PageWrapper>
        <Suspense fallback={<div className="flex justify-center items-center h-40">Загрузка...</div>}>
          <Routes>
            {Object.values(routeConfig).map(({ path, element, isPublic, roles }) => (
                <Route
                    key={path}
                    path={path}
                    element={isPublic ? element : (
                      <RequireAuth roles={roles}>
                        {element as ReactElement}
                      </RequireAuth>
                    )}
                />
            ))}
          </Routes>
        </Suspense>
      </PageWrapper>
  );
};
