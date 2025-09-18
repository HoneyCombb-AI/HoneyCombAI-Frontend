'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import emailjs from '@emailjs/browser';
import axios from 'axios';

const supportSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  title: z.string().optional().default('Support Request'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

type SupportFormData = z.infer<typeof supportSchema>;

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      title: 'Support Request'
    }
  });

  const onSubmit = async (data: SupportFormData) => {
    setIsSubmitting(true);
    
    try {
      // Step 1: Validate and check rate limit with server
      await axios.post('/api/support', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });


      // Step 2: Send email directly via EmailJS
      const combinedMessage = `Email: ${data.email}\n\n${data.message}`;
      
      const templateParams = {
        name: data.name,
        title: data.title || 'Support Request',
        message: combinedMessage,
      };


      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );


      toast.success('Message sent successfully! We\'ll get back to you soon.');
      reset();
    } catch (error) {
      console.error('Error details:', error);
      
      // Handle Axios error responses
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message || 'Server error';
        toast.error(errorMessage);
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to send message');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-left mb-8 md:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Contact Support</h1>
        <p className="mt-2 text-sm text-gray-600">
          Need help? Send us a message and we&apos;ll get back to you.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                {...register('name')}
                className="mt-1"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className="mt-1"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <Input
                id="title"
                type="text"
                placeholder="Support Request"
                {...register('title')}
                className="mt-1"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                placeholder="Tell us how we can help you..."
                {...register('message')}
                className="mt-1 w-full p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
              />
              {errors.message && (
                <p className="mt-2 text-sm text-red-600">{errors.message.message}</p>
              )}
            </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </div>
  );
}