import React, { forwardRef } from 'react';
import {
  IconActivity,
  IconAdjustments,
  IconAdjustmentsHorizontal,
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowDown,
  IconArrowRight,
  IconArrowUp,
  IconArrowUpRight,
  IconArrowsExchange,
  IconArrowsUpDown,
  IconAward,
  IconBan,
  IconBell,
  IconBellOff,
  IconBolt,
  IconBug,
  IconBuilding,
  IconBuildingSkyscraper,
  IconBuildingStore,
  IconBulb,
  IconCalculator,
  IconCalendar,
  IconCash,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircleCheck,
  IconCirclePlus,
  IconCircleX,
  IconClock,
  IconCloud,
  IconCloudUpload,
  IconCompass,
  IconCopy,
  IconCreditCard,
  IconCrown,
  IconCurrencyDollar,
  IconDatabase,
  IconDeviceDesktop,
  IconDeviceFloppy,
  IconDeviceMobile,
  IconDownload,
  IconEdit,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconFilePlus,
  IconFileSpreadsheet,
  IconFileText,
  IconFilter,
  IconFlame,
  IconGift,
  IconGlobe,
  IconGripVertical,
  IconHelpCircle,
  IconHistory,
  IconInfoCircle,
  IconKey,
  IconLayoutDashboard,
  IconLifebuoy,
  IconLoader2,
  IconLock,
  IconLockOpen,
  IconLogin,
  IconLogout,
  IconMail,
  IconMapPin,
  IconMapPinPlus,
  IconMaximize,
  IconMenu2,
  IconMessage,
  IconMoon,
  IconNavigation,
  IconPackage,
  IconPaperclip,
  IconPencil,
  IconPercentage,
  IconPhone,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconPower,
  IconPrinter,
  IconReceipt,
  IconRefresh,
  IconRotateClockwise,
  IconRotateClockwise2,
  IconSearch,
  IconSelector,
  IconSend,
  IconSettings,
  IconShield,
  IconShieldCheck,
  IconShieldExclamation,
  IconShieldLock,
  IconShieldX,
  IconShirt,
  IconShoppingBag,
  IconSparkles,
  IconSquare,
  IconStack2,
  IconStar,
  IconSun,
  IconTable,
  IconTag,
  IconTicket,
  IconToggleLeft,
  IconToggleRight,
  IconTopologyStarRing3,
  IconTrash,
  IconTrendingUp,
  IconTruck,
  IconUpload,
  IconUser,
  IconUserCheck,
  IconUserPlus,
  IconUserX,
  IconUsers,
  IconVideo,
  IconWind,
  IconX
} from '@tabler/icons-react';

// Wrapper unifiant le style Tabler Lined (stroke 1.8 par défaut, forwardRef, compatibilité totale de props)
export const createTablerIcon = (IconComponent) => {
  if (!IconComponent) return () => null;
  const Wrapped = forwardRef(({ size = 20, color = 'currentColor', stroke = 1.8, strokeWidth, className = '', style = {}, ...rest }, ref) => (
    <IconComponent
      ref={ref}
      size={size}
      color={color}
      stroke={strokeWidth !== undefined ? strokeWidth : stroke}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      {...rest}
    />
  ));
  Wrapped.displayName = IconComponent.displayName || 'TablerIconWrapper';
  return Wrapped;
};

// Re-export direct de toute la bibliothèque Tabler
// Re-exporting only mapped icons for optimal tree-shaking
export {
  IconActivity,
  IconAdjustments,
  IconAdjustmentsHorizontal,
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowDown,
  IconArrowRight,
  IconArrowUp,
  IconArrowUpRight,
  IconArrowsExchange,
  IconArrowsUpDown,
  IconAward,
  IconBan,
  IconBell,
  IconBellOff,
  IconBolt,
  IconBug,
  IconBuilding,
  IconBuildingSkyscraper,
  IconBuildingStore,
  IconBulb,
  IconCalculator,
  IconCalendar,
  IconCash,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircleCheck,
  IconCirclePlus,
  IconCircleX,
  IconClock,
  IconCloud,
  IconCloudUpload,
  IconCompass,
  IconCopy,
  IconCreditCard,
  IconCrown,
  IconCurrencyDollar,
  IconDatabase,
  IconDeviceDesktop,
  IconDeviceFloppy,
  IconDeviceMobile,
  IconDownload,
  IconEdit,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconFilePlus,
  IconFileSpreadsheet,
  IconFileText,
  IconFilter,
  IconFlame,
  IconGift,
  IconGlobe,
  IconGripVertical,
  IconHelpCircle,
  IconHistory,
  IconInfoCircle,
  IconKey,
  IconLayoutDashboard,
  IconLifebuoy,
  IconLoader2,
  IconLock,
  IconLockOpen,
  IconLogin,
  IconLogout,
  IconMail,
  IconMapPin,
  IconMapPinPlus,
  IconMaximize,
  IconMenu2,
  IconMessage,
  IconMoon,
  IconNavigation,
  IconPackage,
  IconPaperclip,
  IconPencil,
  IconPercentage,
  IconPhone,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconPower,
  IconPrinter,
  IconReceipt,
  IconRefresh,
  IconRotateClockwise,
  IconRotateClockwise2,
  IconSearch,
  IconSelector,
  IconSend,
  IconSettings,
  IconShield,
  IconShieldCheck,
  IconShieldExclamation,
  IconShieldLock,
  IconShieldX,
  IconShirt,
  IconShoppingBag,
  IconSparkles,
  IconSquare,
  IconStack2,
  IconStar,
  IconSun,
  IconTable,
  IconTag,
  IconTicket,
  IconToggleLeft,
  IconToggleRight,
  IconTopologyStarRing3,
  IconTrash,
  IconTrendingUp,
  IconTruck,
  IconUpload,
  IconUser,
  IconUserCheck,
  IconUserPlus,
  IconUserX,
  IconUsers,
  IconVideo,
  IconWind,
  IconX
};

// Mappings des icônes compatibles Lucide vers Tabler Lined
export const Activity = createTablerIcon(IconActivity);
export const AlertCircle = createTablerIcon(IconAlertCircle);
export const AlertTriangle = createTablerIcon(IconAlertTriangle);
export const ArrowDown = createTablerIcon(IconArrowDown);
export const ArrowRight = createTablerIcon(IconArrowRight);
export const ArrowUp = createTablerIcon(IconArrowUp);
export const ArrowUpDown = createTablerIcon(IconArrowsUpDown);
export const ArrowUpRight = createTablerIcon(IconArrowUpRight);
export const Award = createTablerIcon(IconAward);
export const Ban = createTablerIcon(IconBan);
export const Bug = createTablerIcon(IconBug);
export const Building2 = createTablerIcon(IconBuildingSkyscraper);
export const Calculator = createTablerIcon(IconCalculator);
export const Calendar = createTablerIcon(IconCalendar);
export const Check = createTablerIcon(IconCheck);
export const CheckCircle = createTablerIcon(IconCircleCheck);
export const CheckCircle2 = createTablerIcon(IconCircleCheck);
export const ChevronDown = createTablerIcon(IconChevronDown);
export const ChevronLeft = createTablerIcon(IconChevronLeft);
export const ChevronRight = createTablerIcon(IconChevronRight);
export const ChevronUp = createTablerIcon(IconChevronUp);
export const Clock = createTablerIcon(IconClock);
export const Cloud = createTablerIcon(IconCloud);
export const Compass = createTablerIcon(IconCompass);
export const Copy = createTablerIcon(IconCopy);
export const CreditCard = createTablerIcon(IconCreditCard);
export const Crown = createTablerIcon(IconCrown);
export const Database = createTablerIcon(IconDatabase);
export const DollarSign = createTablerIcon(IconCurrencyDollar);
export const Download = createTablerIcon(IconDownload);
export const Edit = createTablerIcon(IconEdit);
export const Edit3 = createTablerIcon(IconPencil);
export const ExternalLink = createTablerIcon(IconExternalLink);
export const Eye = createTablerIcon(IconEye);
export const EyeOff = createTablerIcon(IconEyeOff);
export const FileSpreadsheet = createTablerIcon(IconFileSpreadsheet);
export const FileText = createTablerIcon(IconFileText);
export const Filter = createTablerIcon(IconFilter);
export const Flame = createTablerIcon(IconFlame);
export const Gift = createTablerIcon(IconGift);
export const Globe = createTablerIcon(IconGlobe);
export const GripVertical = createTablerIcon(IconGripVertical);
export const HelpCircle = createTablerIcon(IconHelpCircle);
export const Info = createTablerIcon(IconInfoCircle);
export const Key = createTablerIcon(IconKey);
export const Layers = createTablerIcon(IconStack2);
export const LayoutDashboard = createTablerIcon(IconLayoutDashboard);
export const LifeBuoy = createTablerIcon(IconLifebuoy);
export const Lightbulb = createTablerIcon(IconBulb);
export const Loader2 = createTablerIcon(IconLoader2);
export const Lock = createTablerIcon(IconLock);
export const LogIn = createTablerIcon(IconLogin);
export const LogOut = createTablerIcon(IconLogout);
export const Mail = createTablerIcon(IconMail);
export const MapPin = createTablerIcon(IconMapPin);
export const Maximize2 = createTablerIcon(IconMaximize);
export const MessageSquare = createTablerIcon(IconMessage);
export const Monitor = createTablerIcon(IconDeviceDesktop);
export const Navigation = createTablerIcon(IconNavigation);
export const Package = createTablerIcon(IconPackage);
export const Paperclip = createTablerIcon(IconPaperclip);
export const Pause = createTablerIcon(IconPlayerPause);
export const Percent = createTablerIcon(IconPercentage);
export const Phone = createTablerIcon(IconPhone);
export const Play = createTablerIcon(IconPlayerPlay);
export const Plus = createTablerIcon(IconPlus);
export const PlusCircle = createTablerIcon(IconCirclePlus);
export const Power = createTablerIcon(IconPower);
export const Printer = createTablerIcon(IconPrinter);
export const Receipt = createTablerIcon(IconReceipt);
export const RefreshCw = createTablerIcon(IconRefresh);
export const RotateCcw = createTablerIcon(IconRotateClockwise2);
export const RotateCw = createTablerIcon(IconRotateClockwise);
export const Save = createTablerIcon(IconDeviceFloppy);
export const Search = createTablerIcon(IconSearch);
export const Send = createTablerIcon(IconSend);
export const Settings = createTablerIcon(IconSettings);
export const Shield = createTablerIcon(IconShield);
export const ShieldAlert = createTablerIcon(IconShieldExclamation);
export const ShieldCheck = createTablerIcon(IconShieldCheck);
export const Shirt = createTablerIcon(IconShirt);
export const ShoppingBag = createTablerIcon(IconShoppingBag);
export const Sliders = createTablerIcon(IconAdjustments);
export const SlidersHorizontal = createTablerIcon(IconAdjustmentsHorizontal);
export const Smartphone = createTablerIcon(IconDeviceMobile);
export const Sparkles = createTablerIcon(IconSparkles);
export const Square = createTablerIcon(IconSquare);
export const Star = createTablerIcon(IconStar);
export const Store = createTablerIcon(IconBuildingStore);
export const Table = createTablerIcon(IconTable);
export const Tag = createTablerIcon(IconTag);
export const Ticket = createTablerIcon(IconTicket);
export const ToggleLeft = createTablerIcon(IconToggleLeft);
export const ToggleRight = createTablerIcon(IconToggleRight);
export const Trash2 = createTablerIcon(IconTrash);
export const TrendingUp = createTablerIcon(IconTrendingUp);
export const TriangleAlert = createTablerIcon(IconAlertTriangle);
export const Truck = createTablerIcon(IconTruck);
export const Unlock = createTablerIcon(IconLockOpen);
export const Upload = createTablerIcon(IconUpload);
export const UploadCloud = createTablerIcon(IconCloudUpload);
export const User = createTablerIcon(IconUser);
export const UserCheck = createTablerIcon(IconUserCheck);
export const UserPlus = createTablerIcon(IconUserPlus);
export const UserX = createTablerIcon(IconUserX);
export const Users = createTablerIcon(IconUsers);
export const Video = createTablerIcon(IconVideo);
export const Wind = createTablerIcon(IconWind);
export const X = createTablerIcon(IconX);
export const XCircle = createTablerIcon(IconCircleX);
export const Zap = createTablerIcon(IconBolt);

// Dictionnaire de correspondances pour noms dynamiques (Material Symbols & strings)
const dynamicComponents = {
  "dashboard": IconLayoutDashboard,
  "shopping_bag": IconShoppingBag,
  "price_change": IconCurrencyDollar,
  "store": IconBuildingStore,
  "storefront": IconBuildingStore,
  "admin_panel_settings": IconShieldLock,
  "group": IconUsers,
  "history": IconHistory,
  "settings": IconSettings,
  "help": IconHelpCircle,
  "logout": IconLogout,
  "menu": IconMenu2,
  "light_mode": IconSun,
  "dark_mode": IconMoon,
  "notifications": IconBell,
  "notifications_off": IconBellOff,
  "keyboard_arrow_down": IconChevronDown,
  "unfold_more": IconSelector,
  "delete_sweep": IconTrash,
  "lock_reset": IconKey,
  "sync_alt": IconArrowsExchange,
  "assignment_add": IconFilePlus,
  "cancel": IconCircleX,
  "payments": IconCash,
  "gpp_bad": IconShieldX,
  "check_circle": IconCircleCheck,
  "error": IconAlertCircle,
  "info": IconInfoCircle,
  "close": IconX,
  "hub": IconTopologyStarRing3,
  "add_location_alt": IconMapPinPlus,
  "domain": IconBuilding,
  "location_on": IconMapPin,
  "call": IconPhone,
  "person": IconUser,
  "login": IconLogin,
  "edit": IconEdit,
  "delete": IconTrash,
  "search": IconSearch,
};

// Composant TablerIcon universel pour rendu dynamique par nom (ex: <TablerIcon name="settings" size={20} />)
export const TablerIcon = forwardRef(({ name, size = 20, color = 'currentColor', stroke = 1.8, strokeWidth, className = '', style = {}, ...rest }, ref) => {
  if (!name) return null;
  const cleanName = String(name).trim();
  const tablerKey = dynamicMap[cleanName] || 
    (cleanName.startsWith('Icon') ? cleanName : ('Icon' + cleanName.charAt(0).toUpperCase() + cleanName.slice(1)));
  
  const Component = Tabler[tablerKey] || IconHelpCircle;
  return (
    <Component
      ref={ref}
      size={size}
      color={color}
      stroke={strokeWidth !== undefined ? strokeWidth : stroke}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      {...rest}
    />
  );
});

export default TablerIcon;
