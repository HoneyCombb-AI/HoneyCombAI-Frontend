"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

type FormState = "idle" | "loading" | "success" | "error";

export default function VideoSection() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState("loading");
    // Mock API call; in a real app, this would post to an API endpoint.
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!email || !email.includes("@") || !email.includes(".")) {
        throw new Error("Invalid email");
      }
      setFormState("success");
    } catch {
      setFormState("error");
    }
  };

  return (
    <section id="demo" className="bg-white py-20 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold text-black mb-8 max-w-4xl">
            Watch 1-Minute About Honeycomb
          </h1>

          <div className="w-full max-w-[940px] aspect-video rounded-xl shadow-2xl overflow-hidden mb-8">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/Iy1jrya1rbc"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          <div className="w-full max-w-[550px] mt-8">
            {formState === "success" ? (
              <div
                className="bg-white p-4 rounded-lg flex items-center justify-center gap-3"
                role="alert"
              >
                <Image
                  src="https://cdn.prod.website-files.com/66a999af2125597557ba7b53/68c6c8fedb31ef060a4d7aa1_52718cb75317ef8a94fa10bc31cb9fd1_icon-line-check-rounded-color-elements-brix-templates.svg"
                  alt="Success Check"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <p className="text-base text-gray-900">
                  Thanks for subscribing to our newsletter
                </p>
              </div>
            ) : formState === "error" ? (
              <div
                className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center justify-center gap-2"
                role="alert"
              >
                <p>Oops! Something went wrong while submitting the form.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative">
                  <Input
                    type="email"
                    id="BRIX-CTA-Email-V6"
                    placeholder="Enter your work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 w-full rounded-lg border-zinc-900 bg-white px-6 pr-[130px] text-base"
                    aria-label="Enter your work email"
                  />
                  <Button
                    type="submit"
                    disabled={formState === "loading"}
                    className="absolute top-1/2 -translate-y-1/2 right-1 h-12 px-6 bg-black text-white rounded-md text-base font-bold hover:bg-gray-800"
                  >
                    {formState === "loading" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </div>

                <div className="mt-8 flex flex-wrap justify-center items-center gap-x-12 gap-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-xl font-bold text-black">
                      15 Minute Setup
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-xl font-bold text-black">
                      Get Insights Today
                    </span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}