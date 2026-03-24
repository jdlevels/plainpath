import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8F7F4] p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-foreground font-display mb-2">404</h1>
          <p className="text-lg text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
