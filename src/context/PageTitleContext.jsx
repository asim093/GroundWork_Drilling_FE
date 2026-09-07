import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const PageTitleContext = createContext(null);

export const PageTitleProvider = ({ children }) => {
  const [title, setTitle] = useState('');
  const value = useMemo(() => ({ title, setTitle }), [title]);

  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>;
};

export const usePageTitleValue = () => useContext(PageTitleContext)?.title || '';

export const usePageTitle = (title) => {
  const context = useContext(PageTitleContext);

  useEffect(() => {
    context?.setTitle(title);
    return () => context?.setTitle('');
  }, [context, title]);
};
