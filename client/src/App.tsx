// Design reminder: preserve one navigation model across hosted preview and direct file:// use. Hash routes keep the offline bundle self-contained; pathname routes keep the published app discoverable.

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Documentation from "./pages/Documentation";
import Tool from "./pages/Tool";

type NavigateOptions = { replace?: boolean };
type UniversalLocationHook = {
  (): [string, (to: string, options?: NavigateOptions) => void];
  hrefs: (href: string) => string;
};

const universalLocation = Object.assign(
  function useUniversalLocation(): [string, (to: string, options?: NavigateOptions) => void] {
    const fileMode = typeof window !== "undefined" && window.location.protocol === "file:";
    const readLocation = () => {
      if (fileMode) return window.location.hash.replace(/^#/, "") || "/";
      return window.location.pathname || "/";
    };
    const [location, setLocation] = useState(readLocation);

    useEffect(() => {
      const update = () => setLocation(readLocation());
      window.addEventListener(fileMode ? "hashchange" : "popstate", update);
      return () => window.removeEventListener(fileMode ? "hashchange" : "popstate", update);
    }, [fileMode]);

    const navigate = (to: string, options: NavigateOptions = {}) => {
      if (fileMode) {
        const nextHash = `#${to.startsWith("/") ? to : `/${to}`}`;
        if (options.replace) window.location.replace(`${window.location.pathname}${window.location.search}${nextHash}`);
        else window.location.hash = nextHash.slice(1);
      } else {
        const nextPath = to.startsWith("/") ? to : `/${to}`;
        if (options.replace) window.history.replaceState({}, "", nextPath);
        else window.history.pushState({}, "", nextPath);
        setLocation(nextPath);
      }
    };
    return [location, navigate];
  },
  { hrefs: (href: string) => (typeof window !== "undefined" && window.location.protocol === "file:" ? `#${href}` : href) },
) as UniversalLocationHook;

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tool" component={Tool} />
      <Route path="/docs" component={Documentation} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <WouterRouter hook={universalLocation}><Router /></WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
