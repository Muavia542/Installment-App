import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../../lib/auth-context";
import { useClientProfile } from "../../hooks/use-client-queries";
import { useUpdateClientProfile } from "../../hooks/use-client-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

const profileSchema = z.object({
  phone: z.string().min(5, "Phone number is too short").max(20, "Phone number is too long").optional().or(z.literal("")),
  address: z.string().max(255, "Address must be less than 255 characters").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ClientProfile() {
  const { profile: sessionProfile } = useAuth();
  const { data: clientData, isLoading: isFetching } = useClientProfile();
  const updateMutation = useUpdateClientProfile();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: "",
      address: "",
    }
  });

  useEffect(() => {
    if (clientData) {
      reset({
        phone: clientData.phone || "",
        address: clientData.address || "",
      });
    }
  }, [clientData, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateMutation.mutateAsync({
        phone: data.phone || "",
        address: data.address || "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (isFetching) {
    return <div className="p-8 text-center text-gray-500">Loading profile data...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Your Profile</h1>
        <p className="text-sm text-gray-500">Manage your contact information and personal details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            Your account email is associated with your login and cannot be changed here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <div className="p-2 bg-gray-50 border rounded-md text-gray-700">{sessionProfile?.name || 'N/A'}</div>
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <div className="p-2 bg-gray-50 border rounded-md text-gray-700">{sessionProfile?.email || 'N/A'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Update your phone number and address.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            
            {updateMutation.isError && (
              <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md border border-red-200">
                Failed to update profile. Please try again.
              </div>
            )}
            
            {updateMutation.isSuccess && (
              <div className="flex items-center p-3 text-sm bg-green-50 text-green-700 rounded-md border border-green-200">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Profile updated successfully.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" {...register("phone")} />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="123 Main St, Apt 4B" {...register("address")} />
              {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t py-4 bg-gray-50/50 rounded-b-lg">
            <Button type="button" variant="outline" onClick={() => reset()} disabled={updateMutation.isPending}>
              Reset
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
