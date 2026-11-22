import { Icon } from '@iconify/react'
import type { ComponentType, SVGProps } from 'react'
import { cn } from '../../lib/utils'
import data from '../../icons/phosphor-icons.json'
import { ICON_MAP } from '../../icons/map'

type PhosphorName = keyof typeof data

/** Lucide-compatible props so existing call sites keep working. */
export type IconProps = Omit<SVGProps<SVGSVGElement>, 'ref'> & {
  size?: number | string
  strokeWidth?: number
  absoluteStrokeWidth?: boolean
}

export type LucideIcon = ComponentType<IconProps>

function glyph(name: keyof typeof ICON_MAP) {
  const icon = data[ICON_MAP[name] as PhosphorName]
  return function Glyph({ className, size = 16, strokeWidth: _s, absoluteStrokeWidth: _a, color, style, ...rest }: IconProps) {
    return (
      <Icon
        icon={icon}
        className={cn('align-[-0.125em]', className)}
        style={{ width: size, height: size, ...style }}
        {...(rest as Record<string, unknown>)}
      />
    )
  }
}

/* Every icon comes from the Phosphor collection (Iconify). No hand-drawn SVGs. */
export const Accessibility = glyph('Accessibility')
export const Activity = glyph('Activity')
export const ChartLineUp = glyph('ChartLineUp')
export const House = glyph('House')
export const Palette = glyph('Palette')
export const UserCircle = glyph('UserCircle')
export const AlertCircle = glyph('AlertCircle')
export const ArrowDown = glyph('ArrowDown')
export const ArrowDownRight = glyph('ArrowDownRight')
export const ArrowLeft = glyph('ArrowLeft')
export const ArrowRight = glyph('ArrowRight')
export const ArrowUp = glyph('ArrowUp')
export const ArrowUpRight = glyph('ArrowUpRight')
export const Award = glyph('Award')
export const BadgeCheck = glyph('BadgeCheck')
export const BarChart3 = glyph('BarChart3')
export const Bell = glyph('Bell')
export const BellOff = glyph('BellOff')
export const BookMarked = glyph('BookMarked')
export const BookOpen = glyph('BookOpen')
export const BookOpenCheck = glyph('BookOpenCheck')
export const Calendar = glyph('Calendar')
export const CalendarCheck = glyph('CalendarCheck')
export const CalendarDays = glyph('CalendarDays')
export const CalendarX2 = glyph('CalendarX2')
export const Check = glyph('Check')
export const CheckCheck = glyph('CheckCheck')
export const CheckCircle2 = glyph('CheckCircle2')
export const ChevronDown = glyph('ChevronDown')
export const ChevronLeft = glyph('ChevronLeft')
export const ChevronRight = glyph('ChevronRight')
export const CircleDot = glyph('CircleDot')
export const ClipboardCheck = glyph('ClipboardCheck')
export const ClipboardList = glyph('ClipboardList')
export const Clock = glyph('Clock')
export const Code2 = glyph('Code2')
export const Copy = glyph('Copy')
export const CreditCard = glyph('CreditCard')
export const Crown = glyph('Crown')
export const Download = glyph('Download')
export const ExternalLink = glyph('ExternalLink')
export const Eye = glyph('Eye')
export const EyeOff = glyph('EyeOff')
export const FileBarChart2 = glyph('FileBarChart2')
export const FileCheck2 = glyph('FileCheck2')
export const FileText = glyph('FileText')
export const Film = glyph('Film')
export const Flame = glyph('Flame')
export const FolderGit2 = glyph('FolderGit2')
export const Gauge = glyph('Gauge')
export const Gavel = glyph('Gavel')
export const GitBranch = glyph('GitBranch')
export const Github = glyph('Github')
export const Globe = glyph('Globe')
export const GraduationCap = glyph('GraduationCap')
export const Handshake = glyph('Handshake')
export const History = glyph('History')
export const IdCard = glyph('IdCard')
export const Image = glyph('Image')
export const ImageIcon = glyph('ImageIcon')
export const Images = glyph('Images')
export const Inbox = glyph('Inbox')
export const Info = glyph('Info')
export const KeyRound = glyph('KeyRound')
export const Layers = glyph('Layers')
export const LayoutDashboard = glyph('LayoutDashboard')
export const Library = glyph('Library')
export const Linkedin = glyph('Linkedin')
export const ListChecks = glyph('ListChecks')
export const Loader2 = glyph('Loader2')
export const Lock = glyph('Lock')
export const LockKeyhole = glyph('LockKeyhole')
export const LogIn = glyph('LogIn')
export const LogOut = glyph('LogOut')
export const Mail = glyph('Mail')
export const MailCheck = glyph('MailCheck')
export const MailX = glyph('MailX')
export const MapPin = glyph('MapPin')
export const Medal = glyph('Medal')
export const Menu = glyph('Menu')
export const Minus = glyph('Minus')
export const MessageSquare = glyph('MessageSquare')
export const MonitorPlay = glyph('MonitorPlay')
export const MoreHorizontal = glyph('MoreHorizontal')
export const Newspaper = glyph('Newspaper')
export const PanelLeftClose = glyph('PanelLeftClose')
export const PanelLeftOpen = glyph('PanelLeftOpen')
export const PenLine = glyph('PenLine')
export const Pencil = glyph('Pencil')
export const Phone = glyph('Phone')
export const Plus = glyph('Plus')
export const Power = glyph('Power')
export const Printer = glyph('Printer')
export const QrCode = glyph('QrCode')
export const RefreshCw = glyph('RefreshCw')
export const Save = glyph('Save')
export const ScanLine = glyph('ScanLine')
export const Search = glyph('Search')
export const SearchX = glyph('SearchX')
export const Send = glyph('Send')
export const Settings = glyph('Settings')
export const Settings2 = glyph('Settings2')
export const ShieldAlert = glyph('ShieldAlert')
export const ShieldCheck = glyph('ShieldCheck')
export const ShieldOff = glyph('ShieldOff')
export const SlidersHorizontal = glyph('SlidersHorizontal')
export const Smartphone = glyph('Smartphone')
export const Sparkles = glyph('Sparkles')
export const Star = glyph('Star')
export const Ticket = glyph('Ticket')
export const Timer = glyph('Timer')
export const Trash2 = glyph('Trash2')
export const TriangleAlert = glyph('TriangleAlert')
export const Trophy = glyph('Trophy')
export const Upload = glyph('Upload')
export const UserCheck = glyph('UserCheck')
export const UserMinus = glyph('UserMinus')
export const UserPlus = glyph('UserPlus')
export const UserRound = glyph('UserRound')
export const UserX = glyph('UserX')
export const Users = glyph('Users')
export const Vote = glyph('Vote')
export const Wallet = glyph('Wallet')
export const Wand2 = glyph('Wand2')
export const Wrench = glyph('Wrench')
export const X = glyph('X')

export const IconGlyph = glyph
