import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ReviewingALease from "@/pages/guides/ReviewingALease";
import UnderstandingAnNDA from "@/pages/guides/UnderstandingAnNDA";
import EmploymentContractRedFlags from "@/pages/guides/EmploymentContractRedFlags";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/guides/reviewing-a-lease" component={ReviewingALease} />
      <Route path="/guides/understanding-an-nda" component={UnderstandingAnNDA} />
      <Route path="/guides/employment-contract-red-flags" component={EmploymentContractRedFlags} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
