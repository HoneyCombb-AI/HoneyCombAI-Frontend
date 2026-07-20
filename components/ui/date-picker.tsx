"use client"

import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className }: DatePickerProps) {
    const selected = value ? parseISO(value) : undefined

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-9 w-[150px] justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {value ? format(parseISO(value), "MMM d, yyyy") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(date) => {
                        if (date) {
                            const yyyy = date.getFullYear()
                            const mm = String(date.getMonth() + 1).padStart(2, '0')
                            const dd = String(date.getDate()).padStart(2, '0')
                            onChange(`${yyyy}-${mm}-${dd}`)
                        } else {
                            onChange('')
                        }
                    }}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    )
}
