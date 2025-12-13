import { useState, useEffect } from 'react';

interface Breakpoint {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const useResponsive = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>({
    xs: false,
    sm: false,
    md: false,
    lg: false,
    xl: false,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      setBreakpoint({
        xs: width < 600,
        sm: width >= 600 && width < 960,
        md: width >= 960 && width < 1280,
        lg: width >= 1280 && width < 1920,
        xl: width >= 1920,
        isMobile: width < 600,
        isTablet: width >= 600 && width < 960,
        isDesktop: width >= 960,
      });
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};

