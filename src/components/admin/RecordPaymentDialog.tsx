import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { FileUp, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRecordPayment } from "../../hooks/use-admin-mutations";

const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  paymentDate: z.string().min(1, "Date is required"),
  receipt: z.any()
    .optional()
    .refine((file) => {
      if (!file || file.length === 0) return true;
      const f = file[0];
      return f.size <= 10 * 1024 * 1024;
    }, "File size must be less than 10MB")
    .refine((file) => {
      if (!file || file.length === 0) return true;
      const f = file[0];
      return ["image/jpeg", "image/png", "application/pdf"].includes(f.type);
    }, "Only PDF, JPG, and PNG are allowed"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface Props {
  dealId: string;
  clientUserId: string;
  clientName: string;
  productName: string;
  remainingAmount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPaymentDialog({ dealId, clientUserId, clientName, productName, remainingAmount, isOpen, onOpenChange }: Props) {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const mutation = useRecordPayment();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: undefined,
      paymentDate: new Date().toISOString().split("T")[0],
      receipt: undefined,
    }
  });

  const onSubmit = async (data: PaymentFormValues) => {
    setGlobalError(null);
    if (data.amount > remainingAmount) {
      setGlobalError(`Payment amount cannot exceed remaining balance ($${remainingAmount.toLocaleString()})`);
      return;
    }

    try {
      const file = data.receipt && data.receipt.length > 0 ? data.receipt[0] : undefined;
      await mutation.mutateAsync({
        dealId,
        clientUserId,
        amount: data.amount,
        paymentDate: data.paymentDate,
        receiptFile: file
      });
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        reset();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setGlobalError(err.message || "Failed to record payment");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setGlobalError(null);
      setSuccess(false);
    }
    onOpenChange(open);
  };

  const receiptFiles = watch("receipt");
  const hasFile = receiptFiles && receiptFiles.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a new incoming payment for {clientName} ({productName}).
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center text-green-600 font-medium">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            Payment recorded successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            {globalError && (
              <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md border border-red-200">
                {globalError}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input 
                    id="amount" 
                    type="number" 
                    step="0.01" 
                    className="pl-7" 
                    {...register("amount", { valueAsNumber: true })} 
                  />
                </div>
                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
                <p className="text-xs text-gray-500">Max: ${remainingAmount.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input 
                  id="paymentDate" 
                  type="date" 
                  {...register("paymentDate")} 
                />
                {errors.paymentDate && <p className="text-sm text-red-500">{errors.paymentDate.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt Document (Optional)</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:bg-gray-50 transition-colors">
                <div className="space-y-1 text-center">
                  <FileUp className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="receipt"
                      className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>{hasFile ? receiptFiles[0].name : "Upload a file"}</span>
                      <input id="receipt" type="file" className="sr-only" {...register("receipt")} accept=".pdf,.png,.jpg,.jpeg" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>
              {errors.receipt && <p className="text-sm text-red-500">{errors.receipt?.message as string}</p>}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Payment
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
