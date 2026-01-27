"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const partnerSignupSchema = z.object({
  // Step 1: Business Name
  businessName: z.string().min(2, "Business name is required."),

  // Step 2: Cuisine Type
  cuisineType: z.string().min(1, "Please select a cuisine type."),

  // Step 3: Contact Info
  contactName: z.string().min(2, "Contact name is required."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().min(10, "Enter a valid phone number."),
});

type PartnerSignupValues = z.infer<typeof partnerSignupSchema>;

const CUISINE_TYPES = [
  "Nigerian",
  "Ethiopian",
  "Jamaican",
  "Haitian",
  "Ghanaian",
  "Senegalese",
  "Somali",
  "Eritrean",
  "South African",
  "Cameroonian",
  "Ivorian",
  "Trinidadian",
  "Other African",
  "Other Caribbean",
];

export default function JoinAsRestaurantPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PartnerSignupValues>({
    resolver: zodResolver(partnerSignupSchema),
    defaultValues: {
      businessName: "",
      cuisineType: "",
      contactName: "",
      email: "",
      phone: "",
    },
    mode: "onChange",
  });

  const { trigger, getValues } = form;

  const handleNext = async () => {
    let fieldsToValidate: (keyof PartnerSignupValues)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ["businessName"];
    } else if (step === 2) {
      fieldsToValidate = ["cuisineType"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (values: PartnerSignupValues) => {
    setIsSubmitting(true);
    
    try {
      // Submit to API endpoint (to be created)
      const response = await fetch("/api/partner-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit");
      }

      // Redirect to success page
      router.push("/join-as-restaurant/success");
    } catch (error) {
      console.error("Submission error:", error);
      alert(error instanceof Error ? error.message : "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Join as a Restaurant Partner</CardTitle>
          <CardDescription>Get started in just 3 simple steps</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="mb-8 flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold transition-all ${
                      step >= s
                        ? "border-orange-600 bg-orange-600 text-white"
                        : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {step > s ? "✓" : s}
                  </div>
                  <span className="mt-2 text-xs font-medium text-slate-600">
                    {s === 1 ? "Business" : s === 2 ? "Cuisine" : "Contact"}
                  </span>
                </div>
                {s < 3 && (
                  <div
                    className={`h-0.5 flex-1 transition-all ${
                      step > s ? "bg-orange-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Step 1: Business Name */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Business Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Tell us about your restaurant
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your restaurant name"
                            {...field}
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Cuisine Type */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Cuisine Type</h3>
                    <p className="text-sm text-muted-foreground">
                      What type of cuisine do you serve?
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="cuisineType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cuisine Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select cuisine type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CUISINE_TYPES.map((cuisine) => (
                              <SelectItem key={cuisine} value={cuisine}>
                                {cuisine}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Contact Info */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Contact Information</h3>
                    <p className="text-sm text-muted-foreground">
                      How can we reach you?
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your full name"
                            {...field}
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            {...field}
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="(555) 123-4567"
                            {...field}
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-4 pt-4">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={handleBack} className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                {step < 3 ? (
                  <Button type="button" onClick={handleNext} className="ml-auto flex items-center gap-2 bg-orange-600 hover:bg-orange-700">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="ml-auto bg-orange-600 hover:bg-orange-700"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
