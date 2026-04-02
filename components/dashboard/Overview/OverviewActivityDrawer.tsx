"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { formatDistanceToNow, parseISO } from "date-fns"
import axios from "axios"
import { toast } from "sonner"
import {
    Mail,
    UserPlus,
    MessageSquare,
    Send,
    Heart,
    Eye,
    MessageCircle,
    Inbox,
    Building,
    ExternalLink,
} from "lucide-react"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { OverviewStatType, OverviewActivityItem } from "@/types/overview"

interface OverviewActivityDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    statType: OverviewStatType | null
    title: string
}

const ACTIVITY_ICON_MAP: Record<string, React.ElementType> = {
    email: Mail,
    connect: UserPlus,
    connect_with_note: UserPlus,
    message: MessageSquare,
    reply: Send,
    like: Heart,
    comment: MessageCircle,
    reaction: Heart,
    view: Eye,
}

const ACTIVITY_LABEL_MAP: Record<string, string> = {
    email: "Email Sent",
    connect: "Connection Request",
    connect_with_note: "Connection + Note",
    message: "Message Sent",
    reply: "Reply Sent",
    like: "Liked Post",
    comment: "Commented",
    reaction: "Reacted",
    view: "Profile View",
}

const customDrawerStyles = {
    width: '50vw',
    maxWidth: '600px',
}

function ActivityItemSkeleton() {
    return (
        <div className="flex items-start gap-3 px-6 py-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-150 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-5 bg-gray-100 rounded w-1/3 mt-1" />
            </div>
        </div>
    )
}

export function OverviewActivityDrawer({
    open,
    onOpenChange,
    statType,
    title,
}: OverviewActivityDrawerProps) {
    const [items, setItems] = useState<OverviewActivityItem[]>([])
    const [loading, setLoading] = useState(false)
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (open && statType) {
            fetchActivityDetails(statType)
        }
        if (!open) {
            setItems([])
            setImageErrors(new Set())
        }
    }, [open, statType])

    const fetchActivityDetails = async (type: OverviewStatType) => {
        setLoading(true)
        try {
            const response = await axios.get<OverviewActivityItem[]>(
                `/api/overview/activity-details?type=${type}`
            )
            setItems(response.data)
        } catch (err) {
            console.error("Error fetching activity details:", err)
            if (axios.isAxiosError(err) && err.response?.status === 429) {
                toast.error("Too many requests. Please wait before trying again.")
            } else {
                toast.error("Failed to load activity details.")
            }
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    const handleImageError = (contactId: string) => {
        setImageErrors((prev) => new Set(prev).add(contactId))
    }

    const getInitials = (name: string) => {
        if (!name) return "?"
        return name
            .split(" ")
            .map((n) => n.charAt(0))
            .join("")
            .substring(0, 2)
            .toUpperCase()
    }

    const getActivityIcon = (activityType: string) => {
        const IconComponent = ACTIVITY_ICON_MAP[activityType] || Send
        return IconComponent
    }

    const getActivityLabel = (activityType: string) => {
        return ACTIVITY_LABEL_MAP[activityType] || activityType
    }

    const getActivityColor = (activityType: string): string => {
        switch (activityType) {
            case "email":
                return "bg-indigo-100 text-indigo-700 border-indigo-200"
            case "connect":
            case "connect_with_note":
                return "bg-blue-100 text-blue-700 border-blue-200"
            case "message":
            case "reply":
                return "bg-cyan-100 text-cyan-700 border-cyan-200"
            case "like":
            case "reaction":
                return "bg-pink-100 text-pink-700 border-pink-200"
            case "comment":
                return "bg-green-100 text-green-700 border-green-200"
            default:
                return "bg-gray-100 text-gray-700 border-gray-200"
        }
    }

    return (
        <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
            <DrawerContent style={customDrawerStyles}>
                <div className="mx-auto w-full h-screen overflow-y-auto">
                    <DrawerHeader className="sticky top-0 bg-white z-60 border-b">
                        <DrawerTitle>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-semibold text-gray-900">
                                        {title}
                                    </span>
                                    {!loading && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs font-medium"
                                        >
                                            {items.length} {items.length === 1 ? "contact" : "contacts"}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </DrawerTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Activity details for today
                        </p>
                    </DrawerHeader>

                    {loading ? (
                        <div className="divide-y divide-gray-100">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ActivityItemSkeleton key={i} />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Inbox className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                                No activity yet today
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Activity will appear here as actions are completed.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {items.map((item, index) => {
                                const ActivityIcon = getActivityIcon(item.activity_type)
                                const showImage =
                                    item.profile_picture_url &&
                                    !imageErrors.has(item.contact_id)

                                return (
                                    <div
                                        key={`${item.contact_id}-${index}`}
                                        className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 relative">
                                            {showImage ? (
                                                <Image
                                                    src={item.profile_picture_url!}
                                                    alt={item.contact_name || "Contact"}
                                                    fill
                                                    sizes="40px"
                                                    className="object-cover rounded-full"
                                                    onError={() =>
                                                        handleImageError(item.contact_id)
                                                    }
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                                                    {getInitials(
                                                        item.contact_name || ""
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {item.contact_name || "Unknown Contact"}
                                                </p>
                                                {item.contact_linkedin_url && (
                                                    <a
                                                        href={item.contact_linkedin_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#0A66C2] hover:text-[#004182] shrink-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </div>

                                            {item.contact_headline && (
                                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                                    {item.contact_headline}
                                                </p>
                                            )}

                                            {item.contact_email && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Mail className="h-3 w-3 text-gray-400" />
                                                    <p className="text-xs text-gray-900 truncate">
                                                        {item.contact_email}
                                                    </p>
                                                </div>
                                            )}

                                            {item.company_name && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Building className="h-3 w-3 text-gray-400" />
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {item.company_name}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Activity detail */}
                                            {item.activity_detail && (
                                                <p className="text-xs text-gray-600 mt-1.5 line-clamp-1 italic">
                                                    &ldquo;{item.activity_detail}&rdquo;
                                                </p>
                                            )}

                                            {/* Bottom row: badge + sender + time */}
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 py-0 font-normal ${getActivityColor(item.activity_type)}`}
                                                >
                                                    <ActivityIcon className="h-2.5 w-2.5 mr-1" />
                                                    {getActivityLabel(item.activity_type)}
                                                </Badge>

                                                {item.sender_email && (
                                                    <span className="text-[10px] text-gray-900">
                                                        via {item.sender_email}
                                                    </span>
                                                )}

                                                <span className="text-[10px] text-gray-400 ml-auto">
                                                    {item.activity_time
                                                        ? formatDistanceToNow(
                                                            parseISO(item.activity_time),
                                                            { addSuffix: true }
                                                        )
                                                        : ""}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}


                </div>
            </DrawerContent>
        </Drawer>
    )
}
