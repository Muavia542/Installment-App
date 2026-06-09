import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Receipt, CircleDollarSign, CalendarDays } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { useClientDashboard } from "../../hooks/use-client-queries";
import { Skeleton } from "../../components/ui/skeleton";

export function ClientDashboard() {
  const { profile } = useAuth();
  const { data, isLoading } = useClientDashboard();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {profile?.name}</h1>
        <p className="text-sm text-gray-500">Your installment overview.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{data?.activeDeals || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Payment Due</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-12 w-full" /> : (
              <>
                <div className="text-2xl font-bold">
                  {data?.nextInstallmentAmount ? `$${data.nextInstallmentAmount.toLocaleString()}` : '--'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Due Date: {data?.nextDueDate ? new Date(data.nextDueDate).toLocaleDateString() : 'N/A'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">
                ${data?.remainingBalance?.toLocaleString() || '0'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
