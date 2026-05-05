export const contactPhonePattern = /^(?:\+\d{1,14}|\d{1,15})$/

export function sanitizeContactPhoneInput(value: string) {
  const startsWithPlus = value.startsWith("+")
  const maxDigits = startsWithPlus ? 14 : 15
  const digits = value.replace(/\D/g, "").slice(0, maxDigits)

  return startsWithPlus ? `+${digits}` : digits
}

export interface ContactEmailInput {
  email: string
  is_primary: boolean
  label?: string | null
}

export interface ContactPhoneInput {
  phone: string
  is_primary: boolean
  label?: string | null
}
