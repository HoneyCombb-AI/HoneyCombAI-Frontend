"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// Navigation handled by parent component via onContactClick prop
import { TrendingUp } from "lucide-react"

interface Contact {
  contact_id: string
  name: string
  headline: string
  influence_score: number
  persona_label?: string
}

interface Level {
  level: string
  contacts: Contact[]
}

interface OrgHierarchyMapProps {
  levels: Level[]
  onContactClick?: (contactId: string) => void
}

export function OrgHierarchyMap({ levels, onContactClick }: OrgHierarchyMapProps) {

  const getInfluenceColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500"
    if (score >= 0.6) return "bg-blue-500"
    if (score >= 0.4) return "bg-yellow-500"
    return "bg-gray-500"
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Organization Levels */}
      <div className="space-y-8">
        {levels.map((level, levelIdx) => (
          <div key={levelIdx} className="space-y-4">
            {/* Level Header */}
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/20 rounded-full" />
              <h3 className="text-lg font-semibold text-foreground">
                {level.level}
              </h3>
              <Badge variant="outline" className="ml-auto">
                {level.contacts.length} {level.contacts.length === 1 ? 'Contact' : 'Contacts'}
              </Badge>
            </div>

            {/* Contacts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {level.contacts.map((contact) => (
                <Card
                  key={contact.contact_id}
                  className="hover:shadow-lg transition-all duration-300 cursor-pointer border-none bg-gradient-to-br from-card to-card/50 hover:scale-[1.02]"
                  onClick={() => onContactClick?.(contact.contact_id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Contact Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {contact.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {contact.headline}
                        </p>

                        {/* Influence Score */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Influence
                            </span>
                          </div>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getInfluenceColor(contact.influence_score)}`}
                              style={{ width: `${contact.influence_score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {Math.round(contact.influence_score * 100)}%
                          </span>
                        </div>

                        {/* Persona Label */}
                        {contact.persona_label && (
                          <Badge className="mt-2 text-xs" variant="secondary">
                            {contact.persona_label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
