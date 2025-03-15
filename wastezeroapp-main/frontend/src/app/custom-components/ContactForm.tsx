import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import {
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon,
  GiftIcon,
  CheckIcon,
  EyeSlashIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/solid";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  subject: z.string().min(1).max(60),
  content: z.string().min(5).max(300), // Accepts emails with at least 5 characters
});

const ContactForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "Example: Issue with Creating Order...",
      content: "",
    },
  });

  const onSubmit = () => {
    console.log("submitted");
  };

  return (
    <div className="">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            console.log("🔥 Form submitted!"); // Log before handleSubmit
            form.handleSubmit(onSubmit)(e);
          }}
          className="flex flex-col gap-2 text-slate-100  bg-[#d9d9d9]  relative px-10 py-6 rounded-xl"
        >
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <div className="flex flex-row items-center gap-6">
                    <Input className="bg-white w-60" {...field} />
                    <EyeSlashIcon width="20" height="20" />
                  </div>
                </FormControl>
                <FormDescription></FormDescription>
                <FormMessage />
              </FormItem>
            )}
          ></FormField>
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <div>
                    <Input className="bg-white w-96 h-48" {...field} />
                  </div>
                </FormControl>
                <FormDescription></FormDescription>
                <FormMessage />
              </FormItem>
            )}
          ></FormField>

          <Button
            type="submit"
            style={{ color: "#32594A", backgroundColor: "#DCE6D5" }}
            className="max-w-24 mt-4 text-slate-100 active:scale-95"
          >
            Submit
          </Button>
          <p
            style={{ color: "#32594A" }}
            className="text-xs flex flex-row justify-center mt-4 cursor-pointer"
          >
            Terms and Conditions
          </p>
        </form>
      </Form>
    </div>
  );
};

export default ContactForm;
