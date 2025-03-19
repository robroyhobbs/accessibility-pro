import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { urlInputSchema, ScanResult } from "@shared/schema";
import { useScanContext } from "@/context/ScanContext";
import { useAuth } from "@/hooks/use-auth";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2 } from "lucide-react";
import { isValidUrl, isSafeUrl } from "@/lib/validators";

// Extend the urlInputSchema for form validation
const formSchema = urlInputSchema.extend({
  isPaid: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function ScanForm() {
  const { user } = useAuth();
  const { setScanState, setScannedUrl, setResults } = useScanContext();
  const [isValidating, setIsValidating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      isPaid: false,
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/scan", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to scan website");
      }
      return await res.json() as ScanResult & { scanId: number };
    },
    onMutate: (data) => {
      setScanState("scanning");
      setScannedUrl(data.url);
    },
    onSuccess: (data) => {
      setResults(data);
      setScanState("results");
    },
    onError: (error) => {
      console.error("Scan error:", error);
      setScanState("idle");
      // Display error message here
    },
  });

  const validateUrl = async (url: string) => {
    setIsValidating(true);
    try {
      // First check basic URL validity
      if (!isValidUrl(url)) {
        form.setError("url", {
          type: "manual",
          message: "Please enter a valid URL including http:// or https://",
        });
        return false;
      }

      // Then check if URL is safe to scan
      if (!isSafeUrl(url)) {
        form.setError("url", {
          type: "manual",
          message: "For security reasons, we cannot scan local or private network URLs",
        });
        return false;
      }

      form.clearErrors("url");
      return true;
    } catch (error) {
      console.error("URL validation error:", error);
      form.setError("url", {
        type: "manual",
        message: "An error occurred while validating the URL",
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    const isValid = await validateUrl(data.url);
    if (isValid) {
      scanMutation.mutate(data);
    }
  };

  return (
    <Card className="shadow-lg border-border/40">
      <CardContent className="pt-6">
        <div className="max-w-2xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold tracking-tight">Scan Your Website</h2>
                <p className="text-muted-foreground">
                  Enter your website URL to check for WCAG accessibility compliance
                </p>
              </div>

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input 
                          placeholder="https://example.com" 
                          {...field} 
                          className="rounded-r-none"
                          onChange={(e) => {
                            field.onChange(e);
                            if (form.formState.errors.url) {
                              validateUrl(e.target.value);
                            }
                          }}
                        />
                        <Button 
                          type="submit"
                          className="rounded-l-none"
                          disabled={scanMutation.isPending || isValidating}
                        >
                          {scanMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                          )}
                          {scanMutation.isPending ? "Scanning..." : "Scan Now"}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the full URL including http:// or https://
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {user && (
                <FormField
                  control={form.control}
                  name="isPaid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center">
                          Use Premium Scan
                          <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">PRO</Badge>
                        </FormLabel>
                        <FormDescription>
                          Includes deeper analysis, code suggestions, and multi-page scanning
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}