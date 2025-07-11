import { auth } from "@clerk/nextjs/server";
import Sidebar from "@/components/navigation/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChart3, TrendingUp } from "lucide-react";

export default async function ReportsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Sign in to view this page</div>;
  }

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Reports</h1>
          <p className="text-muted-foreground">
            Advanced reporting and analytics coming soon
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reports Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="mb-4">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Advanced Reports Coming Soon
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We're working on advanced reporting features including P&L
                statements, tax reports, and performance summaries tailored for
                Indian markets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/trades"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Trade History
                </a>
                <a
                  href="/analytics"
                  className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics Dashboard
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
}
