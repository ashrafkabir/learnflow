import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [className, setClassName] = useState('page-enter');

  useEffect(() => {
    setClassName('page-enter');
    setDisplayChildren(children);
  }, [location.pathname, children]);

  return <div className={className}>{displayChildren}</div>;
}
